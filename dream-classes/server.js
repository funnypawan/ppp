/**
 * DREAM CLASSES — secure backend (Express + SQLite + JWT + bcrypt)
 * Serves: Student PWA (/) + Teacher/Admin Panel (/admin) + REST API (/api)
 * Teacher: Dream Sir | Kothwara, Dobhi, Gaya, Bihar
 */
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const webpush = require('web-push');
const { PDFDocument, StandardFonts, rgb, degrees } = require('pdf-lib');
const { db, getSetting, setSetting, dbPath, uploadsDir, legacyUploadsDir, usingCustomStorage, resolveUploadPath } = require('./db');
const { getSmsConfig, sendOtpSms } = require('./sms-provider');

const app = express();
const PORT = process.env.PORT || 3000;
let JWT_SECRET = process.env.JWT_SECRET || getSetting('jwt_secret', '');
if (!JWT_SECRET) { JWT_SECRET = crypto.randomBytes(32).toString('hex'); setSetting('jwt_secret', JWT_SECRET); }
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const OTP_MODE = String(process.env.OTP_MODE || (IS_PRODUCTION ? 'production' : 'development')).toLowerCase();
// A visible local test OTP is possible only outside production and only when
// explicitly enabled for automated/local tests. Production always fails
// closed until a real SMS provider is configured; it never returns a demo OTP.
const LOCAL_OTP_MODE = !IS_PRODUCTION && ['development', 'test', 'local'].includes(OTP_MODE) && process.env.ALLOW_DEV_OTP === '1';
const DEV_OTP_MODE = LOCAL_OTP_MODE; // kept name for config-status compatibility
// Owner-requested default: students sign in with their name only. The older
// mobile/SMS OTP endpoints stay available only when an operator explicitly
// sets STUDENT_AUTH_MODE=otp; the shipped student app no longer asks for a
// mobile number or OTP.
const STUDENT_AUTH_MODE = String(process.env.STUDENT_AUTH_MODE || 'name').toLowerCase() === 'otp' ? 'otp' : 'name';
const OTP_LOGIN_ENABLED = STUDENT_AUTH_MODE === 'otp';
const SMS_CONFIG = getSmsConfig();
const OTP_TTL_MS = Math.max(2, Math.min(15, Number(process.env.OTP_TTL_MINUTES || 10))) * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = Math.max(0, Number(process.env.OTP_RESEND_COOLDOWN_SECONDS ?? 60)) * 1000;
const OTP_MAX_PER_MOBILE_HOUR = Math.max(1, Number(process.env.OTP_MAX_PER_MOBILE_HOUR || 5));
const OTP_MAX_PER_IP_HOUR = Math.max(1, Number(process.env.OTP_MAX_PER_IP_HOUR || 30));
const OTP_MAX_ATTEMPTS = 5;
const CONFIG_WARNINGS = [];
if (!process.env.JWT_SECRET) CONFIG_WARNINGS.push('JWT_SECRET env not set — using a generated secret stored in the local DB. Set JWT_SECRET in production.');
if (!OTP_LOGIN_ENABLED) CONFIG_WARNINGS.push('Student login is NAME-ONLY by owner request: mobile number and SMS OTP are disabled in the student app. Anyone who knows the exact full name of a student can sign in with that name, so teacher approval and batch control remain important.');
else if (LOCAL_OTP_MODE) CONFIG_WARNINGS.push('OTP is in LOCAL TEST MODE. This is disabled automatically when NODE_ENV=production; never use it for real students.');
else if (!SMS_CONFIG.configured) CONFIG_WARNINGS.push(`Real SMS OTP is not configured (missing: ${SMS_CONFIG.missing.join(', ')}). Student OTP requests will honestly return “not configured”; no demo OTP will be shown.`);
if (IS_PRODUCTION && !usingCustomStorage) CONFIG_WARNINGS.push('Database/uploads are using the app folder. On Render this is ephemeral unless DATA_DIR/UPLOADS_DIR (or STORAGE_DIR) points to a persistent disk such as /var/data/dream-classes.');
try { if (!db.prepare("SELECT 1 FROM users WHERE role='SUPER_ADMIN'").get()) CONFIG_WARNINGS.push('No Super Admin exists yet. Set ADMIN_EMAIL + a strong ADMIN_PASSWORD and run seed, or use the protected first-time setup with ADMIN_SETUP_TOKEN.'); } catch {}

if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
const BUILTIN_ORIGINS = ['https://localhost', 'capacitor://localhost', 'http://localhost'];
const ALLOWED_ORIGINS = [...new Set([...BUILTIN_ORIGINS, ...(process.env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean)])];
app.use(cors({ origin: (origin, cb) => cb(null, !origin || ALLOWED_ORIGINS.includes(origin)) }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=()');
  if (IS_PRODUCTION) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html' }));
// Vendored browser libs (served locally — no CDN dependency): PDF.js reader + HLS adaptive playback
app.use('/vendor/pdfjs', express.static(path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build')));
app.use('/vendor/hls', express.static(path.join(__dirname, 'node_modules', 'hls.js', 'dist')));

// ---------- Web Push (VAPID) — real device push, no Firebase account needed ----------
let VAPID_PUBLIC = getSetting('vapid_public', '');
if (!VAPID_PUBLIC) {
  const keys = webpush.generateVAPIDKeys();
  setSetting('vapid_public', keys.publicKey); setSetting('vapid_private', keys.privateKey);
  VAPID_PUBLIC = keys.publicKey;
}
webpush.setVapidDetails(process.env.VAPID_EMAIL || 'mailto:admin@dreamclasses.in', VAPID_PUBLIC, getSetting('vapid_private', ''));
async function sendPush(userIds, title, body) {
  if (!userIds || !userIds.length) return { sent: 0, failed: 0 };
  const subs = db.prepare(`SELECT * FROM push_subscriptions WHERE user_id IN (${userIds.map(() => '?').join(',')})`).all(...userIds);
  let sent = 0, failed = 0;
  await Promise.all(subs.map(async s => {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: JSON.parse(s.keys) }, JSON.stringify({ title, body, url: '/' })); sent++; }
    catch (e) { failed++; if (e.statusCode === 404 || e.statusCode === 410) db.prepare('DELETE FROM push_subscriptions WHERE id=?').run(s.id); }
  }));
  return { sent, failed };
}
function resolveRecipients(targetType, targetId) {
  if (targetType === 'STUDENT' && targetId) return [targetId];
  let q = "SELECT id FROM users WHERE role='STUDENT' AND status='APPROVED'";
  if (targetType === 'BATCH' && targetId) return db.prepare(q + ' AND batch_id=?').all(targetId).map(r => r.id);
  if (targetType === 'CLASS' && targetId) return db.prepare(q + ' AND class_id=?').all(targetId).map(r => r.id);
  return db.prepare(q).all().map(r => r.id);
}
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/admin/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// ---------- helpers ----------
const audit = (userId, action, detail, req) => { try { db.prepare('INSERT INTO audit_logs(user_id,action,detail,ip) VALUES(?,?,?,?)').run(userId || null, action, String(detail || ''), req?.ip || ''); } catch {} };
const maskMobile = m => m ? '******' + String(m).slice(-4) : '';
const publicUser = u => u && ({ id: u.id, name: u.name, mobile: u.mobile, maskedMobile: maskMobile(u.mobile), email: u.email, role: u.role, status: u.status, class_id: u.class_id, batch_id: u.batch_id, photo: u.photo, created_at: u.created_at });
const sign = u => jwt.sign({ id: u.id, role: u.role, tv: u.session_token_version, scope: 'session' }, JWT_SECRET, { expiresIn: '7d' });
const normalizeEmail = value => String(value || '').trim().toLowerCase();
const normalizeIndianMobile = value => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : '';
};
const normalizeStudentName = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().replace(/\s+/g, ' ').slice(0, 80);
const studentNameKey = value => normalizeStudentName(value).toLowerCase();
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 10);
function passwordMatches(password, hash) {
  try { return bcrypt.compareSync(String(password || ''), hash || DUMMY_PASSWORD_HASH); } catch { return false; }
}
function safeEqualText(a, b) {
  const ah = crypto.createHash('sha256').update(String(a || '')).digest();
  const bh = crypto.createHash('sha256').update(String(b || '')).digest();
  return crypto.timingSafeEqual(ah, bh);
}
function fileTokenPathAllowed(req) {
  if (req.method !== 'GET') return false;
  const requestPath = String(req.originalUrl || req.url || '').split('?')[0];
  return /^\/api\/files\/images\/[\w.-]+$/.test(requestPath)
    || /^\/api\/pdfs\/\d+\/file$/.test(requestPath)
    || /^\/api\/admin\/tests\/\d+\/export\.csv$/.test(requestPath)
    || requestPath === '/api/admin/backup.db';
}

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  // Full session JWTs are accepted only in the Authorization header. Browser
  // file/media tags may use ft=, a separate 30-minute file-only token.
  const token = h.startsWith('Bearer ') ? h.slice(7) : (req.query.ft || '');
  if (!token) return res.status(401).json({ error: 'Login required' });
  try {
    const p = jwt.verify(token, JWT_SECRET);
    if (p.purpose === 'file-access' && !fileTokenPathAllowed(req)) return res.status(403).json({ error: 'This file link cannot be used for account APIs.' });
    if (p.purpose && p.purpose !== 'file-access') return res.status(401).json({ error: 'Invalid session token' });
    const u = db.prepare('SELECT * FROM users WHERE id=?').get(p.id);
    if (!u || u.session_token_version !== p.tv) return res.status(401).json({ error: 'Session expired. Please login again.' });
    if (u.status === 'BLOCKED' || u.status === 'SUSPENDED' || u.status === 'REJECTED') return res.status(403).json({ error: 'Account ' + u.status.toLowerCase() + '. Contact Dream Sir.' });
    req.user = u;
    req.authScope = p.purpose === 'file-access' ? 'file' : 'session';
    next();
  } catch { return res.status(401).json({ error: 'Invalid or expired session' }); }
}
const adminOnly = (req, res, next) => (req.user.role === 'SUPER_ADMIN' || req.user.role === 'TEACHER') ? next() : res.status(403).json({ error: 'Admin access only' });
const superOnly = (req, res, next) => req.user.role === 'SUPER_ADMIN' ? next() : res.status(403).json({ error: 'Super Admin only' });
const studentActive = (req, res, next) => {
  if (req.user.role !== 'STUDENT') return next();
  if (req.user.status !== 'APPROVED') return res.status(403).json({ error: 'PENDING_APPROVAL', message: 'Your account is waiting for approval by Dream Sir.' });
  next();
};
function isValidMcq(body) {
  return !!body && String(body.text || '').trim().length > 0 && Array.isArray(body.options) && body.options.length >= 2 &&
    body.options.every(o => String(o || '').trim().length > 0) && Number.isInteger(Number(body.correct)) &&
    Number(body.correct) >= 0 && Number(body.correct) < body.options.length;
}
// Batch access rule: empty batch list = all batches of that class allowed; else student batch must match.
function canAccess(table, itemId, user) {
  if (user.role !== 'STUDENT') return true;
  const rows = db.prepare(`SELECT batch_id FROM ${table} WHERE ${table === 'video_batches' ? 'video_id' : table === 'pdf_batches' ? 'pdf_id' : 'test_id'}=?`).all(itemId);
  if (!rows.length) return true;
  return rows.some(r => r.batch_id === user.batch_id);
}

// ---------- uploads ----------
function makeUpload(dir, types, mb) {
  fs.mkdirSync(path.join(uploadsDir, dir), { recursive: true });
  return multer({
    storage: multer.diskStorage({ destination: path.join(uploadsDir, dir), filename: (r, f, cb) => cb(null, Date.now() + '-' + crypto.randomBytes(4).toString('hex') + path.extname(f.originalname).toLowerCase()) }),
    limits: { fileSize: mb * 1024 * 1024 },
    fileFilter: (r, f, cb) => types.test(path.extname(f.originalname).toLowerCase()) ? cb(null, true) : cb(new Error('File type not allowed'))
  });
}
function uploadedFiles(req) {
  const files = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) files.push(...req.files);
  else if (req.files && typeof req.files === 'object') Object.values(req.files).forEach(list => files.push(...list));
  return files;
}
function fileSignatureMatches(file) {
  try {
    const ext = path.extname(file.originalname || file.filename || '').toLowerCase();
    const fd = fs.openSync(file.path, 'r');
    const head = Buffer.alloc(16);
    const read = fs.readSync(fd, head, 0, head.length, 0);
    fs.closeSync(fd);
    const b = head.subarray(0, read);
    if (ext === '.pdf') return b.subarray(0, 5).toString() === '%PDF-';
    if (ext === '.jpg' || ext === '.jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    if (ext === '.png') return b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (ext === '.webp') return b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP';
    if (ext === '.mp4' || ext === '.mov') return b.subarray(4, 8).toString() === 'ftyp';
    if (ext === '.webm') return b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    if (ext === '.m3u8') return b.toString().startsWith('#EXTM3U');
    return false;
  } catch { return false; }
}
function validateUploadedFiles(req, res, next) {
  const files = uploadedFiles(req);
  const invalid = files.find(file => !fileSignatureMatches(file));
  if (!invalid) return next();
  files.forEach(file => fs.unlink(file.path, () => {}));
  return res.status(400).json({ error: 'Uploaded file content does not match its file type. Please upload a genuine PDF/image/video file.' });
}
const upVideo = makeUpload('videos', /\.(mp4|webm|mov|m3u8)$/, 500);
const upReply = makeUpload('images', /\.(jpg|jpeg|png|webp|pdf)$/, 25); // doubt replies: image or PDF solution
const upPdf = makeUpload('pdfs', /\.pdf$/, 50);
const upImg = makeUpload('images', /\.(jpg|jpeg|png|webp)$/, 8);
const upThumb = makeUpload('thumbs', /\.(jpg|jpeg|png|webp)$/, 5);

// ---------- STUDENT AUTH ----------
const otpLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 60, message: { error: 'Too many OTP requests from this connection. Please try after some time.', code: 'OTP_RATE_LIMIT' } });
const verifyLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 100, message: { error: 'Too many OTP verification attempts. Please try after some time.', code: 'OTP_RATE_LIMIT' } });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many login attempts. Try after some time.' } });
const nameLoginLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 300, message: { error: 'Too many student login attempts from this connection. Please try after some time.', code: 'NAME_LOGIN_RATE_LIMIT' } });
function cleanupOldOtps(now = Date.now()) {
  try { db.prepare('DELETE FROM otps WHERE created_at<?').run(now - 24 * 60 * 60 * 1000); } catch {}
}
setInterval(cleanupOldOtps, 60 * 60 * 1000).unref?.();
function findStudentForNameLogin(nameKey, deviceId) {
  if (deviceId) {
    const byDevice = db.prepare("SELECT * FROM users WHERE role='STUDENT' AND login_name_key=? AND device_id=? ORDER BY id").get(nameKey, deviceId);
    if (byDevice) return byDevice;
  }
  const matches = db.prepare("SELECT * FROM users WHERE role='STUDENT' AND login_name_key=? ORDER BY id").all(nameKey);
  // Pure name-only login (owner-requested): if one account has this exact
  // normalized full name, that is the account. If several same-name accounts
  // already exist and none belongs to this device, do not guess between
  // them; a separate device-bound account is created for teacher review.
  return matches.length === 1 ? matches[0] : null;
}
app.post('/api/auth/name-login', nameLoginLimiter, (req, res) => {
  const name = normalizeStudentName(req.body?.name);
  const nameKey = studentNameKey(name);
  const deviceId = String(req.body?.device_id || 'web').slice(0, 120);
  if (name.length < 2 || !/[\p{L}\p{N}]/u.test(name)) {
    return res.status(400).json({ error: 'Please enter your full name.', code: 'NAME_REQUIRED' });
  }

  let user = findStudentForNameLogin(nameKey, deviceId);
  let created = false;
  if (user && ['BLOCKED', 'SUSPENDED', 'REJECTED'].includes(user.status)) {
    return res.status(403).json({ error: 'Account ' + user.status.toLowerCase() + '. Please contact Dream Sir.', code: 'ACCOUNT_' + user.status });
  }
  if (!user) {
    const status = getSetting('approval_mode', 'MANUAL') === 'AUTO' ? 'APPROVED' : 'PENDING';
    const id = db.prepare('INSERT INTO users(role,name,login_name_key,status,device_id) VALUES(?,?,?,?,?)')
      .run('STUDENT', name, nameKey, status, deviceId).lastInsertRowid;
    user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
    created = true;
    audit(user.id, 'REGISTER_NAME', name, req);
  }

  // Keep the previous single-active-session behaviour: signing in on this
  // device/token bumps the token version for the matched student account.
  db.prepare('UPDATE users SET login_name_key=?, session_token_version=session_token_version+1, device_id=?, last_login=datetime(?) WHERE id=?')
    .run(nameKey, deviceId, 'now', user.id);
  user = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
  audit(user.id, created ? 'LOGIN_NAME_NEW' : 'LOGIN_NAME', 'name-only', req);
  res.status(created ? 201 : 200).json({ token: sign(user), user: publicUser(user), created, authMode: 'name' });
});
function rejectOtpLoginIfDisabled(req, res) {
  if (OTP_LOGIN_ENABLED) return false;
  res.status(410).json({ error: 'Mobile OTP login is disabled. Students now login with their name only.', code: 'OTP_LOGIN_DISABLED', studentAuthMode: STUDENT_AUTH_MODE });
  return true;
}
app.post('/api/auth/request-otp', otpLimiter, async (req, res) => {
  if (rejectOtpLoginIfDisabled(req, res)) return;
  const mobile = normalizeIndianMobile(req.body?.mobile);
  if (!mobile) return res.status(400).json({ error: 'Enter a valid Indian mobile number (10 digits, or +91 followed by 10 digits).', code: 'INVALID_MOBILE' });
  if (!LOCAL_OTP_MODE && !SMS_CONFIG.configured) {
    audit(null, 'OTP_NOT_CONFIGURED', maskMobile(mobile), req);
    return res.status(503).json({ error: 'OTP SMS service is not configured yet. Please contact Dream Classes office.', code: 'OTP_NOT_CONFIGURED' });
  }

  const now = Date.now();
  cleanupOldOtps(now);
  const latest = db.prepare('SELECT * FROM otps WHERE mobile=? ORDER BY id DESC').get(mobile);
  const elapsed = latest ? now - Number(latest.created_at || 0) : OTP_RESEND_COOLDOWN_MS;
  if (latest && elapsed < OTP_RESEND_COOLDOWN_MS) {
    return res.status(429).json({ error: 'Please wait before requesting another OTP.', code: 'OTP_COOLDOWN', retryAfterSeconds: Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000) });
  }
  const hourAgo = now - 60 * 60 * 1000;
  const mobileCount = db.prepare('SELECT COUNT(*) n FROM otps WHERE mobile=? AND created_at>=?').get(mobile, hourAgo).n;
  if (mobileCount >= OTP_MAX_PER_MOBILE_HOUR) return res.status(429).json({ error: 'Too many OTP requests for this mobile number. Please try after one hour.', code: 'OTP_MOBILE_RATE_LIMIT' });
  const ipCount = db.prepare('SELECT COUNT(*) n FROM otps WHERE request_ip=? AND created_at>=?').get(req.ip || '', hourAgo).n;
  if (ipCount >= OTP_MAX_PER_IP_HOUR) return res.status(429).json({ error: 'Too many OTP requests from this connection. Please try after some time.', code: 'OTP_IP_RATE_LIMIT' });

  const code = String(crypto.randomInt(100000, 1000000));
  db.prepare("UPDATE otps SET status='SUPERSEDED' WHERE mobile=? AND status IN ('ACTIVE','PENDING_SEND')").run(mobile);
  const otpId = db.prepare('INSERT INTO otps(mobile,code_hash,expires_at,attempts,created_at,status,request_ip,provider) VALUES(?,?,?,?,?,?,?,?)')
    .run(mobile, bcrypt.hashSync(code, 10), now + OTP_TTL_MS, 0, now, LOCAL_OTP_MODE ? 'ACTIVE' : 'PENDING_SEND', req.ip || '', LOCAL_OTP_MODE ? 'local-test' : SMS_CONFIG.provider).lastInsertRowid;
  audit(null, 'OTP_REQUEST', maskMobile(mobile), req);

  const responseMeta = { ok: true, expiresInMinutes: Math.round(OTP_TTL_MS / 60000), resendAfterSeconds: Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000) };
  if (LOCAL_OTP_MODE) return res.json({ ...responseMeta, delivery: 'LOCAL_TEST', devOtp: code, note: 'LOCAL TEST ONLY: this code is returned by the test server and is never shown by the production app UI.' });

  try {
    const sent = await sendOtpSms({ mobile, code });
    db.prepare("UPDATE otps SET status='ACTIVE', provider=?, provider_request_id=?, last_sent_at=? WHERE id=? AND status='PENDING_SEND'")
      .run(sent.provider, sent.requestId || null, Date.now(), otpId);
    audit(null, 'OTP_SMS_ACCEPTED', `${maskMobile(mobile)} via ${sent.provider}`, req);
    // Generic wording does not reveal whether the number already has an account.
    return res.json({ ...responseMeta, delivery: 'SMS', note: 'If this mobile number can receive SMS, a one-time password has been sent.' });
  } catch (e) {
    db.prepare("UPDATE otps SET status='SEND_FAILED' WHERE id=?").run(otpId);
    audit(null, 'OTP_SMS_FAILED', `${maskMobile(mobile)} via ${SMS_CONFIG.provider || 'unknown'}`, req);
    console.error('OTP provider error:', e.message);
    const status = e.code === 'SMS_NOT_CONFIGURED' ? 503 : 502;
    return res.status(status).json({ error: status === 503 ? 'OTP SMS service is not configured yet. Please contact Dream Classes office.' : 'OTP could not be sent right now. Please wait a moment and try again.', code: e.code || 'OTP_SEND_FAILED' });
  }
});
app.post('/api/auth/verify-otp', verifyLimiter, (req, res) => {
  if (rejectOtpLoginIfDisabled(req, res)) return;
  const mobile = normalizeIndianMobile(req.body?.mobile);
  const code = String(req.body?.code || '').trim();
  const name = String(req.body?.name || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 80);
  const parsedClassId = req.body?.class_id === null || req.body?.class_id === undefined || req.body?.class_id === '' ? null : Number(req.body.class_id);
  const deviceId = String(req.body?.device_id || 'web').slice(0, 120);
  if (!mobile || !/^\d{6}$/.test(code)) return res.status(400).json({ error: 'Enter the 6-digit OTP sent to your mobile number.', code: 'OTP_INVALID_FORMAT' });

  const now = Date.now();
  const row = db.prepare("SELECT * FROM otps WHERE mobile=? AND status='ACTIVE' ORDER BY id DESC").get(mobile);
  if (!row) return res.status(400).json({ error: 'OTP expired, already used, or not requested. Please request a new OTP.', code: 'OTP_EXPIRED' });
  if (Number(row.expires_at) <= now) {
    db.prepare("UPDATE otps SET status='EXPIRED' WHERE id=?").run(row.id);
    return res.status(400).json({ error: 'OTP expired. Please request a new OTP.', code: 'OTP_EXPIRED' });
  }
  if (Number(row.attempts || 0) >= OTP_MAX_ATTEMPTS) {
    db.prepare("UPDATE otps SET status='LOCKED' WHERE id=?").run(row.id);
    return res.status(429).json({ error: 'Too many wrong OTP attempts. Please request a new OTP.', code: 'OTP_LOCKED' });
  }

  let correct = false;
  try { correct = bcrypt.compareSync(code, row.code_hash); } catch { correct = false; }
  if (!correct) {
    const attempts = Number(row.attempts || 0) + 1;
    db.prepare('UPDATE otps SET attempts=?, status=? WHERE id=?').run(attempts, attempts >= OTP_MAX_ATTEMPTS ? 'LOCKED' : 'ACTIVE', row.id);
    return res.status(400).json({ error: 'Incorrect OTP. Please check the latest SMS and try again.', code: 'OTP_INVALID', attemptsRemaining: Math.max(0, OTP_MAX_ATTEMPTS - attempts) });
  }

  // Correct OTP is NOT consumed yet. A brand-new student may still need to
  // supply a valid name/class; consuming here was the old "OTP expired" bug.
  let user = db.prepare('SELECT * FROM users WHERE mobile=?').get(mobile);
  if (user && user.role !== 'STUDENT') {
    db.prepare("UPDATE otps SET status='USED', verified_at=? WHERE id=? AND status='ACTIVE'").run(now, row.id);
    return res.status(403).json({ error: 'This mobile number cannot be used for student login. Please contact Dream Classes office.', code: 'STUDENT_LOGIN_NOT_ALLOWED' });
  }
  if (!user) {
    if (name.length < 2) {
      db.prepare('UPDATE otps SET verified_at=COALESCE(verified_at,?) WHERE id=?').run(now, row.id);
      return res.status(422).json({ error: 'NEW_USER_NAME_REQUIRED', code: 'NEW_USER_NAME_REQUIRED', message: 'New student — please enter your full name, then verify the same OTP again.' });
    }
    if (parsedClassId !== null && (!Number.isInteger(parsedClassId) || !db.prepare('SELECT 1 FROM classes WHERE id=?').get(parsedClassId))) {
      db.prepare('UPDATE otps SET verified_at=COALESCE(verified_at,?) WHERE id=?').run(now, row.id);
      return res.status(422).json({ error: 'Please select a valid class.', code: 'INVALID_CLASS' });
    }
  }
  if (user && ['BLOCKED', 'SUSPENDED', 'REJECTED'].includes(user.status)) {
    db.prepare("UPDATE otps SET status='USED', verified_at=? WHERE id=? AND status='ACTIVE'").run(now, row.id);
    return res.status(403).json({ error: 'Account ' + user.status.toLowerCase() + '. Please contact Dream Sir.', code: 'ACCOUNT_' + user.status });
  }

  const consumed = db.prepare("UPDATE otps SET status='USED', verified_at=? WHERE id=? AND status='ACTIVE' AND expires_at>?").run(now, row.id, now);
  if (!consumed.changes) return res.status(400).json({ error: 'OTP expired or already used. Please request a new OTP.', code: 'OTP_EXPIRED' });

  if (!user) {
    const status = getSetting('approval_mode', 'MANUAL') === 'AUTO' ? 'APPROVED' : 'PENDING';
    const id = db.prepare('INSERT INTO users(role,name,login_name_key,mobile,status,class_id,device_id) VALUES(?,?,?,?,?,?,?)').run('STUDENT', name, studentNameKey(name), mobile, status, parsedClassId, deviceId).lastInsertRowid;
    user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
    audit(user.id, 'REGISTER', name, req);
  }
  // Single-device enforcement: bump token version (old device logged out)
  db.prepare('UPDATE users SET session_token_version=session_token_version+1, device_id=?, last_login=datetime(?) WHERE id=?').run(deviceId, 'now', user.id);
  user = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
  audit(user.id, 'LOGIN', 'OTP', req);
  res.json({ token: sign(user), user: publicUser(user) });
});
// ---------- ADMIN AUTH ----------
app.get('/api/setup/status', (req, res) => {
  const hasSuperAdmin = !!db.prepare("SELECT 1 FROM users WHERE role='SUPER_ADMIN'").get();
  res.json({ setupRequired: !hasSuperAdmin, setupTokenConfigured: String(process.env.ADMIN_SETUP_TOKEN || '').length >= 24 });
});
app.post('/api/setup/admin', loginLimiter, (req, res) => {
  if (db.prepare("SELECT 1 FROM users WHERE role='SUPER_ADMIN'").get()) return res.status(409).json({ error: 'First-time setup is already complete.' });
  const configuredToken = String(process.env.ADMIN_SETUP_TOKEN || '');
  if (configuredToken.length < 24) return res.status(503).json({ error: 'First-time setup token is not configured on the server. Use ADMIN_EMAIL + ADMIN_PASSWORD with seed instead.' });
  const providedToken = req.headers['x-setup-token'] || req.body?.setup_token || '';
  if (!safeEqualText(providedToken, configuredToken)) return res.status(401).json({ error: 'Invalid setup token.' });
  const name = String(req.body?.name || 'Dream Sir').trim().slice(0, 80);
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) return res.status(400).json({ error: 'Enter the teacher name, a valid email and a password of at least 12 characters.' });
  if (db.prepare('SELECT 1 FROM users WHERE lower(email)=?').get(email)) return res.status(400).json({ error: 'That email is already registered.' });
  const id = db.prepare("INSERT INTO users(role,name,email,password_hash,status) VALUES('SUPER_ADMIN',?,?,?,'APPROVED')").run(name, email, bcrypt.hashSync(password, 10)).lastInsertRowid;
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
  audit(user.id, 'FIRST_ADMIN_SETUP', email, req);
  res.status(201).json({ token: sign(user), user: publicUser(user) });
});
app.post('/api/auth/admin-login', loginLimiter, (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  const u = db.prepare('SELECT * FROM users WHERE lower(email)=? AND role IN (?,?)').get(email, 'SUPER_ADMIN', 'TEACHER');
  const valid = passwordMatches(password, u?.password_hash);
  if (!u || !valid || u.status !== 'APPROVED') {
    audit(u?.id || null, 'ADMIN_LOGIN_FAILED', email || '(blank email)', req);
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  db.prepare('UPDATE users SET email=?, last_login=datetime(?) WHERE id=?').run(email, 'now', u.id);
  const fresh = db.prepare('SELECT * FROM users WHERE id=?').get(u.id);
  audit(u.id, 'ADMIN_LOGIN', u.email, req);
  res.json({ token: sign(fresh), user: publicUser(fresh) });
});
app.get('/api/auth/me', auth, (req, res) => res.json({ user: publicUser(req.user), settings: { approval_mode: getSetting('approval_mode', 'MANUAL') } }));
app.get('/api/auth/file-token', auth, (req, res) => {
  if (req.authScope !== 'session') return res.status(403).json({ error: 'A full login session is required.' });
  const fileToken = jwt.sign({ id: req.user.id, role: req.user.role, tv: req.user.session_token_version, purpose: 'file-access' }, JWT_SECRET, { expiresIn: '30m' });
  res.json({ fileToken, expiresInSeconds: 1800 });
});
app.post('/api/auth/logout', auth, (req, res) => { db.prepare('UPDATE users SET session_token_version=session_token_version+1 WHERE id=?').run(req.user.id); audit(req.user.id, 'LOGOUT', '', req); res.json({ ok: true }); });
app.put('/api/auth/profile', auth, (req, res) => {
  const { name, class_id, fcm_token } = req.body || {};
  const cleanName = name !== undefined ? normalizeStudentName(name) : null;
  if (name !== undefined && cleanName.length < 2) return res.status(400).json({ error: 'Please enter your full name.' });
  db.prepare('UPDATE users SET name=COALESCE(?,name), login_name_key=COALESCE(?,login_name_key), class_id=COALESCE(?,class_id), fcm_token=COALESCE(?,fcm_token) WHERE id=?')
    .run(cleanName || null, cleanName ? studentNameKey(cleanName) : null, class_id || null, fcm_token || null, req.user.id);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id)) });
});
app.post('/api/auth/photo', auth, upImg.single('photo'), validateUploadedFiles, (req, res) => { if (!req.file) return res.status(400).json({ error: 'No photo uploaded' }); const p = '/uploads/images/' + req.file.filename; db.prepare('UPDATE users SET photo=? WHERE id=?').run(p, req.user.id); res.json({ photo: p }); });
app.delete('/api/auth/account', auth, (req, res) => { if (req.user.role === 'SUPER_ADMIN') return res.status(400).json({ error: 'Super Admin account cannot be deleted from the app.' }); db.prepare('DELETE FROM users WHERE id=?').run(req.user.id); audit(req.user.id, 'ACCOUNT_DELETED', req.user.name, req); res.json({ ok: true }); });
app.use('/uploads/thumbs', express.static(path.join(uploadsDir, 'thumbs')));
if (uploadsDir !== legacyUploadsDir) app.use('/uploads/thumbs', express.static(path.join(legacyUploadsDir, 'thumbs')));
// Private uploads (profile photos, doubt question/solution images & PDFs): authenticated + ownership-checked.
app.get('/api/files/images/:name', auth, studentActive, (req, res) => {
  const name = path.basename(req.params.name);
  if (name !== req.params.name || !/^[\w.-]+$/.test(name)) return res.status(400).json({ error: 'Bad file name' });
  const rel = '/uploads/images/' + name;
  const u = req.user;
  let allowed = u.role !== 'STUDENT';
  if (!allowed && u.photo === rel) allowed = true;
  if (!allowed) allowed = !!db.prepare('SELECT 1 FROM doubts WHERE image=? AND student_id=?').get(rel, u.id);
  if (!allowed) allowed = !!db.prepare('SELECT 1 FROM doubt_replies r JOIN doubts d ON d.id=r.doubt_id WHERE (r.image=? OR r.pdf=?) AND d.student_id=?').get(rel, rel, u.id);
  if (!allowed) return res.status(403).json({ error: 'Not your file' });
  const file = resolveUploadPath('/uploads/images/' + name);
  if (!fs.existsSync(file)) return res.status(404).end();
  const types = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.pdf': 'application/pdf' };
  res.setHeader('Content-Type', types[path.extname(name).toLowerCase()] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'private, max-age=300');
  fs.createReadStream(file).pipe(res);
});

// ---------- PUBLIC CATALOG (names only; content needs approval) ----------
app.get('/api/catalog', (req, res) => {
  const classes = db.prepare('SELECT * FROM classes WHERE published=1 ORDER BY sort,name').all();
  res.json({ classes });
});

// ---------- STUDENT: structure & content ----------
app.get('/api/structure', auth, studentActive, (req, res) => {
  const cls = db.prepare('SELECT * FROM classes WHERE published=1 ORDER BY sort').all();
  const data = cls.map(c => ({ ...c, subjects: db.prepare('SELECT * FROM subjects WHERE class_id=? AND published=1 ORDER BY sort').all(c.id).map(s => ({ ...s, chapters: db.prepare('SELECT * FROM chapters WHERE subject_id=? AND published=1 ORDER BY sort').all(s.id) })) }));
  res.json({ classes: data });
});
function chapterContent(chapterId, user) {
  const videos = db.prepare('SELECT id,title,description,source_type,thumbnail,duration_sec,downloadable,sort,created_at FROM videos WHERE chapter_id=? AND published=1 ORDER BY sort').all(chapterId).filter(v => canAccess('video_batches', v.id, user));
  const pdfs = db.prepare('SELECT id,title,description,downloadable,sort,created_at FROM pdf_notes WHERE chapter_id=? AND published=1 ORDER BY sort').all(chapterId).filter(p => canAccess('pdf_batches', p.id, user));
  const tests = db.prepare("SELECT id,title,duration_min,state,starts_at,ends_at FROM tests WHERE chapter_id=? AND state IN ('PUBLISHED','SCHEDULED','CLOSED')").all(chapterId).filter(t => canAccess('test_batches', t.id, user));
  if (user.role === 'STUDENT') {
    const prog = db.prepare('SELECT video_id,position_sec,completed FROM progress WHERE student_id=?').all(user.id);
    const map = Object.fromEntries(prog.map(p => [p.video_id, p]));
    videos.forEach(v => v.progress = map[v.id] || null);
  }
  const practiceCount = db.prepare('SELECT COUNT(*) n FROM practice_questions WHERE chapter_id=? AND published=1').get(chapterId).n;
  return { videos, pdfs, tests, practiceCount };
}
function chapterVisible(chapterId, user) {
  if (user.role !== 'STUDENT') return true;
  return !!db.prepare(`SELECT 1 FROM chapters ch JOIN subjects s ON s.id=ch.subject_id JOIN classes c ON c.id=s.class_id
    WHERE ch.id=? AND ch.published=1 AND s.published=1 AND c.published=1`).get(chapterId);
}
app.get('/api/chapters/:id/content', auth, studentActive, (req, res) => {
  if (!chapterVisible(+req.params.id, req.user)) return res.status(404).json({ error: 'Chapter not available' });
  res.json(chapterContent(+req.params.id, req.user));
});
function linkedChapterVisible(chapterId, user) { return !chapterId || chapterVisible(chapterId, user); }

// Signed, short-lived playback token (5 min)
app.get('/api/videos/:id/play', auth, studentActive, (req, res) => {
  const v = db.prepare('SELECT * FROM videos WHERE id=? AND published=1').get(+req.params.id);
  if (!v || !linkedChapterVisible(v.chapter_id, req.user)) return res.status(404).json({ error: 'Video not found' });
  if (!canAccess('video_batches', v.id, req.user)) return res.status(403).json({ error: 'This lecture is not assigned to your batch.' });
  const playToken = jwt.sign({ vid: v.id, uid: req.user.id, purpose: 'playback' }, JWT_SECRET, { expiresIn: '5m' });
  const prog = req.user.role === 'STUDENT' ? db.prepare('SELECT * FROM progress WHERE student_id=? AND video_id=?').get(req.user.id, v.id) : null;
  let streamUrl = v.url;
  if (v.source_type === 'upload') streamUrl = '/api/stream/' + v.id + '?pt=' + playToken;
  const sib = db.prepare('SELECT id,title FROM videos WHERE chapter_id=? AND published=1 ORDER BY sort').all(v.chapter_id).filter(x => canAccess('video_batches', x.id, req.user));
  const i = sib.findIndex(x => x.id === v.id);
  res.json({ video: { id: v.id, title: v.title, description: v.description, source_type: v.source_type, url: v.source_type === 'upload' ? null : v.url, qualities: JSON.parse(v.qualities || '[]'), downloadable: !!v.downloadable }, streamUrl, resumeAt: prog ? prog.position_sec : 0, prev: sib[i - 1] || null, next: sib[i + 1] || null, watermark: { name: req.user.name, mobile: maskMobile(req.user.mobile) } });
});
app.get('/api/stream/:id', (req, res) => {
  try { const p = jwt.verify(req.query.pt || '', JWT_SECRET); if (p.purpose !== 'playback' || p.vid !== +req.params.id) throw 0; } catch { return res.status(403).json({ error: 'Playback link expired. Reopen the lecture.' }); }
  const v = db.prepare('SELECT * FROM videos WHERE id=?').get(+req.params.id);
  if (!v || !v.file_path) return res.status(404).end();
  const file = resolveUploadPath(v.file_path);
  if (!fs.existsSync(file)) return res.status(404).end();
  const stat = fs.statSync(file), range = req.headers.range;
  if (!range) { res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes' }); return fs.createReadStream(file).pipe(res); }
  const match = /^bytes=(\d*)-(\d*)$/.exec(String(range).trim());
  if (!match || (!match[1] && !match[2])) return res.status(416).setHeader('Content-Range', `bytes */${stat.size}`).end();
  let start, end;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!suffix) return res.status(416).setHeader('Content-Range', `bytes */${stat.size}`).end();
    start = Math.max(0, stat.size - suffix); end = stat.size - 1;
  } else {
    start = Number(match[1]); end = match[2] ? Number(match[2]) : stat.size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= stat.size || end < start) return res.status(416).setHeader('Content-Range', `bytes */${stat.size}`).end();
  end = Math.min(end, stat.size - 1);
  res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Content-Type': 'video/mp4' });
  fs.createReadStream(file, { start, end }).pipe(res);
});
app.post('/api/progress', auth, studentActive, (req, res) => {
  const { video_id, position_sec, completed } = req.body || {};
  const v = db.prepare('SELECT id,chapter_id FROM videos WHERE id=? AND published=1').get(+video_id);
  if (!v || !linkedChapterVisible(v.chapter_id, req.user) || !canAccess('video_batches', v.id, req.user)) return res.status(403).json({ error: 'Not allowed' });
  db.prepare('INSERT INTO progress(student_id,video_id,position_sec,completed) VALUES(?,?,?,?) ON CONFLICT(student_id,video_id) DO UPDATE SET position_sec=excluded.position_sec, completed=MAX(completed,excluded.completed), updated_at=datetime(?)')
    .run(req.user.id, +video_id, Math.floor(position_sec || 0), completed ? 1 : 0, 'now');
  res.json({ ok: true });
});
app.get('/api/pdfs/:id/file', auth, studentActive, async (req, res) => {
  const p = db.prepare('SELECT * FROM pdf_notes WHERE id=? AND published=1').get(+req.params.id);
  if (!p || !linkedChapterVisible(p.chapter_id, req.user)) return res.status(404).json({ error: 'Notes not found' });
  if (!canAccess('pdf_batches', p.id, req.user)) return res.status(403).json({ error: 'Not assigned to your batch.' });
  if (req.query.download && !p.downloadable && req.user.role === 'STUDENT') return res.status(403).json({ error: 'Download is disabled for these notes.' });
  if (p.url) return res.redirect(p.url);
  const file = resolveUploadPath(p.file_path || '');
  if (!fs.existsSync(file)) return res.status(404).end();
  res.setHeader('Content-Type', 'application/pdf');
  // Downloads are stamped with the student's identity on every page (leak tracing).
  if (req.query.download && req.user.role === 'STUDENT') {
    try {
      const doc = await PDFDocument.load(fs.readFileSync(file), { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const label = `DREAM CLASSES | ${req.user.name} | ${maskMobile(req.user.mobile)}`;
      doc.getPages().forEach(pg => {
        const { width, height } = pg.getSize();
        pg.drawText(label, { x: 24, y: 16, size: 8, font, color: rgb(0.45, 0.45, 0.5) });
        pg.drawText(label, { x: width / 2 - 130, y: height / 2, size: 15, font, color: rgb(0.6, 0.6, 0.65), opacity: 0.14, rotate: degrees(32) });
      });
      const bytes = await doc.save();
      res.setHeader('Content-Disposition', 'attachment; filename="dream-classes-notes.pdf"');
      audit(req.user.id, 'PDF_DOWNLOAD', p.title, req);
      return res.send(Buffer.from(bytes));
    } catch (e) { /* fall through to raw file if stamping fails */ }
  }
  res.setHeader('Content-Disposition', 'inline; filename="dream-classes-notes.pdf"');
  fs.createReadStream(file).pipe(res);
});
app.post('/api/pdfs/:id/progress', auth, studentActive, (req, res) => { const p = db.prepare('SELECT id,chapter_id FROM pdf_notes WHERE id=? AND published=1').get(+req.params.id); if (!p || !linkedChapterVisible(p.chapter_id, req.user) || !canAccess('pdf_batches', p.id, req.user)) return res.status(403).json({ error: 'Not allowed' }); db.prepare('INSERT INTO pdf_progress(student_id,pdf_id,page) VALUES(?,?,?) ON CONFLICT(student_id,pdf_id) DO UPDATE SET page=excluded.page').run(req.user.id, +req.params.id, +req.body.page || 1); res.json({ ok: true }); });
app.get('/api/pdfs/:id/progress', auth, studentActive, (req, res) => res.json(db.prepare('SELECT page FROM pdf_progress WHERE student_id=? AND pdf_id=?').get(req.user.id, +req.params.id) || { page: 1 }));

// ---------- TESTS (server-side scoring; answers never sent before review) ----------
app.get('/api/tests', auth, studentActive, (req, res) => {
  const tests = db.prepare("SELECT t.*, c.name chapter_name, s.name subject_name FROM tests t LEFT JOIN chapters c ON c.id=t.chapter_id LEFT JOIN subjects s ON s.id=c.subject_id WHERE t.state IN ('PUBLISHED','SCHEDULED','CLOSED') ORDER BY t.id DESC").all()
    .filter(t => linkedChapterVisible(t.chapter_id, req.user) && canAccess('test_batches', t.id, req.user))
    .map(t => ({ ...t, questionCount: db.prepare('SELECT COUNT(*) n FROM questions WHERE test_id=?').get(t.id).n, myAttempt: db.prepare("SELECT id,score,total,status,submitted_at FROM test_attempts WHERE test_id=? AND student_id=? AND status='SUBMITTED'").get(t.id, req.user.id) || null }));
  res.json({ tests });
});
app.post('/api/tests/:id/start', auth, studentActive, (req, res) => {
  const t = db.prepare('SELECT * FROM tests WHERE id=?').get(+req.params.id);
  if (!t || t.state !== 'PUBLISHED' || !linkedChapterVisible(t.chapter_id, req.user)) return res.status(400).json({ error: 'Test is not open yet.' });
  if (!canAccess('test_batches', t.id, req.user)) return res.status(403).json({ error: 'This test is for another batch.' });
  if (t.starts_at && new Date(t.starts_at) > new Date()) return res.status(400).json({ error: 'Test has not started.' });
  if (t.ends_at && new Date(t.ends_at) < new Date()) return res.status(400).json({ error: 'Test time is over.' });
  if (db.prepare("SELECT 1 FROM test_attempts WHERE test_id=? AND student_id=? AND status='SUBMITTED'").get(t.id, req.user.id)) return res.status(400).json({ error: 'You have already submitted this test.' });
  let att = db.prepare("SELECT * FROM test_attempts WHERE test_id=? AND student_id=? AND status='IN_PROGRESS'").get(t.id, req.user.id);
  if (!att) { const id = db.prepare('INSERT INTO test_attempts(test_id,student_id,started_at) VALUES(?,?,?)').run(t.id, req.user.id, Date.now()).lastInsertRowid; att = db.prepare('SELECT * FROM test_attempts WHERE id=?').get(id); }
  const qs = db.prepare('SELECT id,text,options,marks FROM questions WHERE test_id=? ORDER BY sort').all(t.id).map(q => ({ ...q, options: JSON.parse(q.options) }));
  res.json({ attemptId: att.id, test: { id: t.id, title: t.title, instructions: t.instructions, duration_min: t.duration_min, negative_mark: t.negative_mark }, questions: qs, startedAt: att.started_at, savedAnswers: JSON.parse(att.answers || '{}') });
});
app.post('/api/tests/attempts/:id/save', auth, studentActive, (req, res) => {
  const a = db.prepare("SELECT * FROM test_attempts WHERE id=? AND student_id=? AND status='IN_PROGRESS'").get(+req.params.id, req.user.id);
  if (!a) return res.status(400).json({ error: 'Attempt not active' });
  db.prepare('UPDATE test_attempts SET answers=? WHERE id=?').run(JSON.stringify(req.body.answers || {}), a.id);
  res.json({ ok: true });
});
app.post('/api/tests/attempts/:id/submit', auth, studentActive, (req, res) => {
  const a = db.prepare("SELECT * FROM test_attempts WHERE id=? AND student_id=? AND status='IN_PROGRESS'").get(+req.params.id, req.user.id);
  if (!a) return res.status(400).json({ error: 'Already submitted or invalid attempt (duplicate submission blocked).' });
  const t = db.prepare('SELECT * FROM tests WHERE id=?').get(a.test_id);
  const elapsedSec = Math.floor((Date.now() - a.started_at) / 1000);
  const lateSec = elapsedSec - (t.duration_min * 60);
  // Anti-cheat: after time + 2 min grace, ignore newly-sent answers; score only what was auto-saved during the test.
  const answers = lateSec > 120 ? JSON.parse(a.answers || '{}') : (req.body.answers || JSON.parse(a.answers || '{}'));
  if (lateSec > 120) audit(req.user.id, 'TEST_SUBMIT_LATE', t.title + ' lateBy=' + lateSec + 's (scored from auto-saved answers)', req);
  const qs = db.prepare('SELECT * FROM questions WHERE test_id=?').all(a.test_id);
  let score = 0, total = 0, c = 0, w = 0, s = 0;
  qs.forEach(q => { total += q.marks; const sel = answers[q.id]; if (sel === undefined || sel === null || sel === '') s++; else if (+sel === q.correct) { score += q.marks; c++; } else { score -= (t.negative_mark || 0); w++; } });
  score = Math.max(0, Math.round(score * 100) / 100);
  const taken = Math.floor((Date.now() - a.started_at) / 1000);
  db.prepare("UPDATE test_attempts SET answers=?, submitted_at=?, score=?, total=?, correct_cnt=?, wrong_cnt=?, skipped_cnt=?, time_taken_sec=?, status='SUBMITTED' WHERE id=?")
    .run(JSON.stringify(answers), Date.now(), score, total, c, w, s, taken, a.id);
  audit(req.user.id, 'TEST_SUBMIT', t.title + ' ' + score + '/' + total, req);
  res.json({ result: { attemptId: a.id, score, total, correct: c, wrong: w, skipped: s, totalQuestions: qs.length, attempted: c + w, percentage: total ? Math.round(score / total * 1000) / 10 : 0, timeTakenSec: taken, showAnswers: !!t.show_answers } });
});
app.get('/api/tests/attempts/:id/review', auth, studentActive, (req, res) => {
  const a = db.prepare('SELECT * FROM test_attempts WHERE id=?').get(+req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'STUDENT' && a.student_id !== req.user.id) return res.status(403).json({ error: 'Not your result' });
  const t = db.prepare('SELECT * FROM tests WHERE id=?').get(a.test_id);
  const answers = JSON.parse(a.answers || '{}');
  const qs = db.prepare('SELECT * FROM questions WHERE test_id=? ORDER BY sort').all(a.test_id).map(q => ({ id: q.id, text: q.text, options: JSON.parse(q.options), marks: q.marks, selected: answers[q.id] !== undefined ? +answers[q.id] : null, ...(t.show_answers || req.user.role !== 'STUDENT' ? { correct: q.correct, explanation: q.explanation } : {}) }));
  res.json({ test: { title: t.title, show_answers: !!t.show_answers }, attempt: a, questions: qs });
});
app.get('/api/my/results', auth, studentActive, (req, res) => res.json({ results: db.prepare("SELECT a.*, t.title FROM test_attempts a JOIN tests t ON t.id=a.test_id WHERE a.student_id=? AND a.status='SUBMITTED' ORDER BY a.submitted_at DESC").all(req.user.id) }));

// ---------- DOUBTS ----------
app.get('/api/doubts', auth, studentActive, (req, res) => {
  const rows = req.user.role === 'STUDENT'
    ? db.prepare('SELECT d.*, u.name student_name FROM doubts d JOIN users u ON u.id=d.student_id WHERE d.student_id=? ORDER BY d.id DESC').all(req.user.id)
    : db.prepare('SELECT d.*, u.name student_name, u.mobile FROM doubts d JOIN users u ON u.id=d.student_id ORDER BY d.id DESC').all();
  res.json({ doubts: rows.map(d => ({ ...d, replies: db.prepare('SELECT * FROM doubt_replies WHERE doubt_id=? ORDER BY id').all(d.id) })) });
});
app.post('/api/doubts', auth, studentActive, upImg.single('image'), validateUploadedFiles, (req, res) => {
  const q = String(req.body.question || '').trim();
  if (!q) return res.status(400).json({ error: 'Write your question' });
  const id = db.prepare('INSERT INTO doubts(student_id,chapter_id,subject_id,class_id,question,image) VALUES(?,?,?,?,?,?)').run(req.user.id, req.body.chapter_id || null, req.body.subject_id || null, req.body.class_id || null, q, req.file ? '/uploads/images/' + req.file.filename : null).lastInsertRowid;
  res.json({ doubt: db.prepare('SELECT * FROM doubts WHERE id=?').get(id) });
});
app.post('/api/doubts/:id/reply', auth, studentActive, upReply.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), validateUploadedFiles, (req, res) => {
  const d = db.prepare('SELECT * FROM doubts WHERE id=?').get(+req.params.id);
  if (!d) return res.status(404).json({ error: 'Doubt not found' });
  if (req.user.role === 'STUDENT' && d.student_id !== req.user.id) return res.status(403).json({ error: 'Not your doubt' });
  const img = req.files?.image?.[0], pdf = req.files?.pdf?.[0];
  db.prepare('INSERT INTO doubt_replies(doubt_id,author_id,author_role,text,image,pdf) VALUES(?,?,?,?,?,?)').run(d.id, req.user.id, req.user.role, String(req.body.text || ''), img ? '/uploads/images/' + img.filename : null, pdf ? '/uploads/images/' + pdf.filename : null);
  const requestedStatus = ['PENDING', 'IN_PROGRESS', 'ANSWERED', 'RESOLVED'].includes(req.body.status) ? req.body.status : null;
  const status = req.user.role === 'STUDENT' ? 'PENDING' : (requestedStatus || 'ANSWERED');
  db.prepare("UPDATE doubts SET status=?, updated_at=datetime('now') WHERE id=?").run(status, d.id);
  if (req.user.role !== 'STUDENT') notifyUsers([d.student_id], 'Doubt Answered 💬', 'Dream Sir has answered your doubt.', 'STUDENT', d.student_id, req.user.id);
  res.json({ ok: true });
});
app.put('/api/doubts/:id/status', auth, studentActive, (req, res) => {
  const d = db.prepare('SELECT * FROM doubts WHERE id=?').get(+req.params.id);
  if (!d || (req.user.role === 'STUDENT' && d.student_id !== req.user.id)) return res.status(403).json({ error: 'Not allowed' });
  const allowed = req.user.role === 'STUDENT' ? ['PENDING', 'RESOLVED'] : ['PENDING', 'IN_PROGRESS', 'ANSWERED', 'RESOLVED'];
  if (!allowed.includes(req.body?.status)) return res.status(400).json({ error: 'Invalid doubt status' });
  db.prepare("UPDATE doubts SET status=?, updated_at=datetime('now') WHERE id=?").run(req.body.status, d.id);
  res.json({ ok: true });
});

// ---------- NOTIFICATIONS / ANNOUNCEMENTS ----------
function parseScheduledAt(value) {
  if (!value) return null;
  const raw = String(value).trim().replace(' ', 'T');
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const date = new Date(hasZone ? raw : raw + 'Z');
  return Number.isNaN(date.getTime()) ? null : date;
}
function notifyUsers(userIds, title, message, targetType, targetId, by, scheduledAt) {
  const scheduledDate = parseScheduledAt(scheduledAt);
  const isFuture = scheduledDate && scheduledDate > new Date();
  const id = db.prepare('INSERT INTO notifications(title,message,target_type,target_id,sent_by,status,scheduled_at) VALUES(?,?,?,?,?,?,?)')
    .run(title, message, targetType, targetId || null, by, isFuture ? 'SCHEDULED' : 'SENT', scheduledDate ? scheduledDate.toISOString() : null).lastInsertRowid;
  if (!isFuture) {
    const recipients = (userIds && userIds.length) ? userIds : resolveRecipients(targetType, targetId);
    sendPush(recipients, title, message).catch(() => {}); // Web Push (VAPID); in-app copy always saved above
  }
  return id;
}
// Scheduled-notification dispatcher (runs every 30s)
setInterval(() => {
  try {
    const due = db.prepare("SELECT * FROM notifications WHERE status='SCHEDULED'").all()
      .filter(n => { const d = parseScheduledAt(n.scheduled_at); return d && d <= new Date(); });
    due.forEach(n => { db.prepare("UPDATE notifications SET status='SENT' WHERE id=?").run(n.id); sendPush(resolveRecipients(n.target_type, n.target_id), n.title, n.message).catch(() => {}); });
  } catch {}
}, 30000);
function visibleNotifications(user) {
  return db.prepare("SELECT * FROM notifications WHERE status='SENT' ORDER BY id DESC LIMIT 100").all().filter(n =>
    n.target_type === 'ALL' || (n.target_type === 'BATCH' && n.target_id === user.batch_id) || (n.target_type === 'CLASS' && n.target_id === user.class_id) || (n.target_type === 'STUDENT' && n.target_id === user.id))
    .map(n => ({ ...n, read: !!db.prepare('SELECT 1 FROM notification_reads WHERE notification_id=? AND user_id=?').get(n.id, user.id) }));
}
// Web Push subscription endpoints
app.get('/api/push/key', (req, res) => res.json({ publicKey: VAPID_PUBLIC }));
app.post('/api/push/subscribe', auth, studentActive, (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (!endpoint || !keys) return res.status(400).json({ error: 'Invalid subscription' });
  db.prepare('INSERT INTO push_subscriptions(user_id,endpoint,keys) VALUES(?,?,?) ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id, keys=excluded.keys')
    .run(req.user.id, endpoint, JSON.stringify(keys));
  res.json({ ok: true });
});
app.post('/api/push/unsubscribe', auth, studentActive, (req, res) => { db.prepare('DELETE FROM push_subscriptions WHERE user_id=? AND endpoint=?').run(req.user.id, String((req.body || {}).endpoint || '')); res.json({ ok: true }); });
app.get('/api/notifications', auth, studentActive, (req, res) => res.json({ notifications: visibleNotifications(req.user) }));
app.post('/api/notifications/:id/read', auth, studentActive, (req, res) => { db.prepare('INSERT OR IGNORE INTO notification_reads VALUES(?,?)').run(+req.params.id, req.user.id); res.json({ ok: true }); });
app.get('/api/announcements', auth, studentActive, (req, res) => {
  const rows = db.prepare('SELECT * FROM announcements ORDER BY id DESC LIMIT 50').all();
  res.json({ announcements: req.user.role === 'STUDENT' ? rows.filter(a => !a.batch_id || a.batch_id === req.user.batch_id) : rows });
});

// ---------- STUDENT DASHBOARD / ANALYTICS ----------
app.get('/api/dashboard', auth, studentActive, (req, res) => {
  const uid = req.user.id;
  const totalVideos = db.prepare('SELECT id,chapter_id FROM videos WHERE published=1').all().filter(v => linkedChapterVisible(v.chapter_id, req.user) && canAccess('video_batches', v.id, req.user)).length;
  const completed = db.prepare('SELECT COUNT(*) n FROM progress WHERE student_id=? AND completed=1').get(uid).n;
  const recent = db.prepare('SELECT v.id,v.title,v.thumbnail,p.position_sec,p.completed FROM progress p JOIN videos v ON v.id=p.video_id WHERE p.student_id=? ORDER BY p.updated_at DESC LIMIT 5').all(uid);
  const results = db.prepare("SELECT a.score,a.total,t.title FROM test_attempts a JOIN tests t ON t.id=a.test_id WHERE a.student_id=? AND a.status='SUBMITTED' ORDER BY a.submitted_at DESC LIMIT 5").all(uid);
  const agg = db.prepare("SELECT COUNT(*) attempts, AVG(CASE WHEN total>0 THEN score*100.0/total END) avgPct, MAX(CASE WHEN total>0 THEN score*100.0/total END) bestPct FROM test_attempts WHERE student_id=? AND status='SUBMITTED'").get(uid);
  res.json({
    totalVideos, completed, coursePct: totalVideos ? Math.round(completed / totalVideos * 100) : 0,
    recent, results, attempts: agg.attempts || 0, avgPct: Math.round(agg.avgPct || 0), bestPct: Math.round(agg.bestPct || 0),
    pendingDoubts: db.prepare("SELECT COUNT(*) n FROM doubts WHERE student_id=? AND status IN ('PENDING','IN_PROGRESS')").get(uid).n,
    resolvedDoubts: db.prepare("SELECT COUNT(*) n FROM doubts WHERE student_id=? AND status='RESOLVED'").get(uid).n,
    latestNotes: db.prepare('SELECT id,title,downloadable,created_at,chapter_id FROM pdf_notes WHERE published=1 ORDER BY id DESC LIMIT 25').all().filter(p => linkedChapterVisible(p.chapter_id, req.user) && canAccess('pdf_batches', p.id, req.user)).slice(0, 5),
    upcomingTests: db.prepare("SELECT t.id,t.title,t.state,t.starts_at,t.duration_min,t.chapter_id FROM tests t WHERE t.state IN ('PUBLISHED','SCHEDULED') AND NOT EXISTS (SELECT 1 FROM test_attempts a WHERE a.test_id=t.id AND a.student_id=? AND a.status='SUBMITTED') ORDER BY COALESCE(t.starts_at,'') LIMIT 25").all(uid)
      .filter(t => linkedChapterVisible(t.chapter_id, req.user) && canAccess('test_batches', t.id, req.user)).slice(0, 5),
    subjectPerformance: db.prepare(`SELECT s.name subject, COUNT(*) attempts, ROUND(AVG(CASE WHEN a.total>0 THEN a.score*100.0/a.total END)) pct
      FROM test_attempts a JOIN tests t ON t.id=a.test_id JOIN chapters c ON c.id=t.chapter_id JOIN subjects s ON s.id=c.subject_id
      WHERE a.student_id=? AND a.status='SUBMITTED' GROUP BY s.id ORDER BY s.name`).all(uid),
    practice: db.prepare('SELECT COUNT(*) answered, COALESCE(SUM(correct),0) correct FROM practice_answers WHERE student_id=?').get(uid)
  });
});

// ---------- PRACTICE QUESTIONS (untimed, instant server-checked feedback) ----------
app.get('/api/chapters/:id/practice', auth, studentActive, (req, res) => {
  if (!chapterVisible(+req.params.id, req.user)) return res.status(404).json({ error: 'Chapter not available' });
  const qs = db.prepare('SELECT id,text,options FROM practice_questions WHERE chapter_id=? AND published=1 ORDER BY sort').all(+req.params.id)
    .map(q => ({ ...q, options: JSON.parse(q.options), answered: req.user.role === 'STUDENT' ? (db.prepare('SELECT correct FROM practice_answers WHERE student_id=? AND question_id=?').get(req.user.id, q.id)?.correct ?? null) : null }));
  res.json({ questions: qs });
});
app.post('/api/practice/:id/check', auth, studentActive, (req, res) => {
  const q = db.prepare('SELECT * FROM practice_questions WHERE id=? AND published=1').get(+req.params.id);
  if (!q || !linkedChapterVisible(q.chapter_id, req.user)) return res.status(404).json({ error: 'Question not found' });
  const isCorrect = +req.body.selected === q.correct;
  if (req.user.role === 'STUDENT') db.prepare('INSERT INTO practice_answers(student_id,question_id,correct) VALUES(?,?,?) ON CONFLICT(student_id,question_id) DO UPDATE SET correct=MAX(correct,excluded.correct)').run(req.user.id, q.id, isCorrect ? 1 : 0);
  res.json({ correct: isCorrect, correctIndex: q.correct, explanation: q.explanation || '' });
});

// ================= ADMIN APIs =================
app.use('/api/admin', auth, adminOnly);
app.get('/api/admin/stats', (req, res) => {
  const n = q => db.prepare(q).get().n;
  res.json({
    totalStudents: n("SELECT COUNT(*) n FROM users WHERE role='STUDENT'"), active: n("SELECT COUNT(*) n FROM users WHERE role='STUDENT' AND status='APPROVED'"),
    pending: n("SELECT COUNT(*) n FROM users WHERE role='STUDENT' AND status='PENDING'"), blocked: n("SELECT COUNT(*) n FROM users WHERE role='STUDENT' AND status IN ('BLOCKED','SUSPENDED')"),
    classes: n('SELECT COUNT(*) n FROM classes'), subjects: n('SELECT COUNT(*) n FROM subjects'), chapters: n('SELECT COUNT(*) n FROM chapters'),
    videos: n('SELECT COUNT(*) n FROM videos'), pdfs: n('SELECT COUNT(*) n FROM pdf_notes'), batches: n('SELECT COUNT(*) n FROM batches'),
    tests: n('SELECT COUNT(*) n FROM tests'), attempts: n("SELECT COUNT(*) n FROM test_attempts WHERE status='SUBMITTED'"),
    pendingDoubts: n("SELECT COUNT(*) n FROM doubts WHERE status='PENDING'"), answeredDoubts: n("SELECT COUNT(*) n FROM doubts WHERE status IN ('ANSWERED','RESOLVED')"),
    recentStudents: db.prepare("SELECT id,name,mobile,status,created_at FROM users WHERE role='STUDENT' ORDER BY id DESC LIMIT 6").all(),
    recentUploads: db.prepare('SELECT title,created_at FROM videos ORDER BY id DESC LIMIT 5').all(),
    recentSubmissions: db.prepare("SELECT u.name,t.title,a.score,a.total FROM test_attempts a JOIN users u ON u.id=a.student_id JOIN tests t ON t.id=a.test_id WHERE a.status='SUBMITTED' ORDER BY a.submitted_at DESC LIMIT 5").all(),
    recentDoubts: db.prepare('SELECT d.question,d.status,u.name FROM doubts d JOIN users u ON u.id=d.student_id ORDER BY d.id DESC LIMIT 5').all()
  });
});
const crud = (table, fields) => ({
  list: (req, res) => { const order = fields.includes('sort') ? 'COALESCE(sort,0), id' : 'name, id'; res.json({ items: db.prepare(`SELECT * FROM ${table} ORDER BY ${order}`).all() }); },
  create: (req, res) => { const f = fields.filter(k => req.body[k] !== undefined); const id = db.prepare(`INSERT INTO ${table}(${f.join(',')}) VALUES(${f.map(() => '?').join(',')})`).run(...f.map(k => req.body[k])).lastInsertRowid; audit(req.user.id, 'CREATE_' + table, JSON.stringify(req.body), req); res.json({ item: db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id) }); },
  update: (req, res) => { const f = fields.filter(k => req.body[k] !== undefined); if (!f.length) return res.status(400).json({ error: 'No editable fields supplied' }); db.prepare(`UPDATE ${table} SET ${f.map(k => k + '=?').join(',')} WHERE id=?`).run(...f.map(k => req.body[k]), +req.params.id); res.json({ item: db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(+req.params.id) }); },
  del: (req, res) => { db.prepare(`DELETE FROM ${table} WHERE id=?`).run(+req.params.id); audit(req.user.id, 'DELETE_' + table, req.params.id, req); res.json({ ok: true }); }
});
[['classes', ['name', 'sort', 'published']], ['subjects', ['class_id', 'name', 'icon', 'sort', 'published']], ['chapters', ['subject_id', 'name', 'description', 'sort', 'published']], ['batches', ['name', 'class_id', 'description', 'active']]].forEach(([t, f]) => {
  const c = crud(t, f);
  app.get('/api/admin/' + t, c.list); app.post('/api/admin/' + t, c.create); app.put('/api/admin/' + t + '/:id', c.update); app.delete('/api/admin/' + t + '/:id', c.del);
});
// Students
app.get('/api/admin/students', (req, res) => {
  let q = "SELECT u.*, c.name class_name, b.name batch_name FROM users u LEFT JOIN classes c ON c.id=u.class_id LEFT JOIN batches b ON b.id=u.batch_id WHERE u.role='STUDENT'";
  const p = [];
  if (req.query.search) { q += ' AND (u.name LIKE ? OR u.mobile LIKE ?)'; p.push('%' + req.query.search + '%', '%' + req.query.search + '%'); }
  if (req.query.status) { q += ' AND u.status=?'; p.push(req.query.status); }
  if (req.query.batch_id) { q += ' AND u.batch_id=?'; p.push(+req.query.batch_id); }
  if (req.query.class_id) { q += ' AND u.class_id=?'; p.push(+req.query.class_id); }
  res.json({ students: db.prepare(q + ' ORDER BY u.id DESC').all(...p).map(s => ({ ...publicUser(s), class_name: s.class_name || null, batch_name: s.batch_name || null })) });
});
app.put('/api/admin/students/:id', (req, res) => {
  const { status, batch_id, class_id } = req.body || {};
  const student = db.prepare("SELECT * FROM users WHERE id=? AND role='STUDENT'").get(+req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  if (status !== undefined && !['PENDING', 'APPROVED', 'BLOCKED', 'SUSPENDED', 'REJECTED'].includes(status)) return res.status(400).json({ error: 'Invalid student status' });
  if (batch_id && !db.prepare('SELECT 1 FROM batches WHERE id=?').get(+batch_id)) return res.status(400).json({ error: 'Invalid batch' });
  if (class_id && !db.prepare('SELECT 1 FROM classes WHERE id=?').get(+class_id)) return res.status(400).json({ error: 'Invalid class' });
  const revoke = ['BLOCKED', 'SUSPENDED', 'REJECTED'].includes(status);
  const updates = [], values = [];
  if (status !== undefined) { updates.push('status=?'); values.push(status); }
  if (Object.prototype.hasOwnProperty.call(req.body || {}, 'batch_id')) { updates.push('batch_id=?'); values.push(batch_id ? +batch_id : null); }
  if (Object.prototype.hasOwnProperty.call(req.body || {}, 'class_id')) { updates.push('class_id=?'); values.push(class_id ? +class_id : null); }
  if (revoke) updates.push('session_token_version=session_token_version+1');
  if (!updates.length) return res.status(400).json({ error: 'No student changes supplied' });
  db.prepare(`UPDATE users SET ${updates.join(',')} WHERE id=? AND role='STUDENT'`).run(...values, student.id);
  if (status) audit(req.user.id, 'STUDENT_' + status, req.params.id, req);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(student.id)) });
});
app.post('/api/admin/students/:id/revoke-session', (req, res) => {
  const changed = db.prepare("UPDATE users SET session_token_version=session_token_version+1 WHERE id=? AND role='STUDENT'").run(+req.params.id);
  if (!changed.changes) return res.status(404).json({ error: 'Student not found' });
  audit(req.user.id, 'STUDENT_SESSION_REVOKED', req.params.id, req);
  res.json({ ok: true });
});
app.get('/api/admin/students/:id/progress', (req, res) => {
  const id = +req.params.id;
  res.json({ watched: db.prepare('SELECT v.title,p.completed,p.position_sec FROM progress p JOIN videos v ON v.id=p.video_id WHERE p.student_id=? ORDER BY p.updated_at DESC').all(id), results: db.prepare("SELECT t.title,a.score,a.total FROM test_attempts a JOIN tests t ON t.id=a.test_id WHERE a.student_id=? AND a.status='SUBMITTED'").all(id) });
});
// Videos / PDFs admin
function setBatches(table, col, id, batchIds) { db.prepare(`DELETE FROM ${table} WHERE ${col}=?`).run(id); (batchIds || []).forEach(b => db.prepare(`INSERT OR IGNORE INTO ${table} VALUES(?,?)`).run(id, +b)); }
const withBatches = (rows, table, col) => rows.map(r => ({ ...r, batch_ids: db.prepare(`SELECT batch_id FROM ${table} WHERE ${col}=?`).all(r.id).map(x => x.batch_id) }));
app.get('/api/admin/videos', (req, res) => res.json({ items: withBatches(db.prepare('SELECT * FROM videos ORDER BY sort,id DESC').all(), 'video_batches', 'video_id') }));
app.post('/api/admin/videos', upVideo.single('file'), validateUploadedFiles, (req, res) => {
  const b = req.body;
  if (!String(b.title || '').trim() || (!req.file && !String(b.url || '').trim())) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'Lecture title and either a video file or video URL are required.' });
  }
  let qualities = '[]'; try { const q = JSON.parse(b.qualities || '[]'); if (Array.isArray(q)) qualities = JSON.stringify(q.filter(x => x && x.label && x.url)); } catch {}
  const id = db.prepare('INSERT INTO videos(title,description,chapter_id,source_type,url,file_path,thumbnail,qualities,downloadable,published,sort) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .run(b.title, b.description || '', b.chapter_id || null, req.file ? 'upload' : (b.source_type || 'url'), b.url || null, req.file ? 'uploads/videos/' + req.file.filename : null, b.thumbnail || null, qualities, b.downloadable ? 1 : 0, b.published ? 1 : 0, +b.sort || 0).lastInsertRowid;
  setBatches('video_batches', 'video_id', id, JSON.parse(b.batch_ids || '[]'));
  audit(req.user.id, 'VIDEO_UPLOAD', b.title, req);
  res.json({ item: db.prepare('SELECT * FROM videos WHERE id=?').get(id) });
});
app.put('/api/admin/videos/:id', (req, res) => { const b = req.body; let qualities = undefined; if (b.qualities !== undefined) { try { qualities = JSON.stringify((Array.isArray(b.qualities) ? b.qualities : JSON.parse(b.qualities)).filter(x => x && x.label && x.url)); } catch { qualities = '[]'; } } db.prepare('UPDATE videos SET title=?,description=?,chapter_id=?,url=?,source_type=?,thumbnail=COALESCE(?,thumbnail),qualities=COALESCE(?,qualities),downloadable=?,published=?,sort=? WHERE id=?').run(b.title, b.description, b.chapter_id || null, b.url || null, b.source_type || 'url', b.thumbnail || null, qualities ?? null, b.downloadable ? 1 : 0, b.published ? 1 : 0, +b.sort || 0, +req.params.id); if (b.batch_ids) setBatches('video_batches', 'video_id', +req.params.id, b.batch_ids); res.json({ ok: true }); });
app.delete('/api/admin/videos/:id', (req, res) => { const v = db.prepare('SELECT * FROM videos WHERE id=?').get(+req.params.id); if (v?.file_path) fs.unlink(resolveUploadPath(v.file_path), () => {}); db.prepare('DELETE FROM videos WHERE id=?').run(+req.params.id); res.json({ ok: true }); });
app.post('/api/admin/thumbnail', upThumb.single('file'), validateUploadedFiles, (req, res) => req.file ? res.json({ path: '/uploads/thumbs/' + req.file.filename }) : res.status(400).json({ error: 'No thumbnail uploaded' }));
app.get('/api/admin/pdfs', (req, res) => res.json({ items: withBatches(db.prepare('SELECT * FROM pdf_notes ORDER BY sort,id DESC').all(), 'pdf_batches', 'pdf_id') }));
app.post('/api/admin/pdfs', upPdf.array('files', 10), validateUploadedFiles, (req, res) => {
  const b = req.body, created = [];
  if (!String(b.title || '').trim() || (!(req.files && req.files.length) && !String(b.url || '').trim())) {
    (req.files || []).forEach(f => fs.unlink(f.path, () => {}));
    return res.status(400).json({ error: 'Notes title and either a PDF file or PDF URL are required.' });
  }
  const files = req.files && req.files.length ? req.files : [null];
  files.forEach((f, i) => {
    const id = db.prepare('INSERT INTO pdf_notes(title,description,chapter_id,file_path,url,downloadable,published,sort) VALUES(?,?,?,?,?,?,?,?)')
      .run(files.length > 1 ? `${b.title} (${i + 1})` : b.title, b.description || '', b.chapter_id || null, f ? 'uploads/pdfs/' + f.filename : null, b.url || null, b.downloadable === '0' ? 0 : 1, b.published ? 1 : 0, +b.sort || 0).lastInsertRowid;
    setBatches('pdf_batches', 'pdf_id', id, JSON.parse(b.batch_ids || '[]')); created.push(id);
  });
  audit(req.user.id, 'PDF_UPLOAD', b.title, req);
  res.json({ ok: true, created });
});
app.put('/api/admin/pdfs/:id', (req, res) => { const b = req.body; db.prepare('UPDATE pdf_notes SET title=?,description=?,chapter_id=?,downloadable=?,published=?,sort=? WHERE id=?').run(b.title, b.description, b.chapter_id || null, b.downloadable ? 1 : 0, b.published ? 1 : 0, +b.sort || 0, +req.params.id); if (b.batch_ids) setBatches('pdf_batches', 'pdf_id', +req.params.id, b.batch_ids); res.json({ ok: true }); });
app.delete('/api/admin/pdfs/:id', (req, res) => { const p = db.prepare('SELECT * FROM pdf_notes WHERE id=?').get(+req.params.id); if (p?.file_path) fs.unlink(resolveUploadPath(p.file_path), () => {}); db.prepare('DELETE FROM pdf_notes WHERE id=?').run(+req.params.id); res.json({ ok: true }); });
// Tests admin
app.get('/api/admin/tests', (req, res) => res.json({ items: withBatches(db.prepare('SELECT * FROM tests ORDER BY id DESC').all(), 'test_batches', 'test_id').map(t => ({ ...t, questionCount: db.prepare('SELECT COUNT(*) n FROM questions WHERE test_id=?').get(t.id).n })) }));
app.post('/api/admin/tests', (req, res) => { const b = req.body; const id = db.prepare('INSERT INTO tests(title,instructions,chapter_id,duration_min,negative_mark,show_answers,state,starts_at,ends_at) VALUES(?,?,?,?,?,?,?,?,?)').run(b.title, b.instructions || '', b.chapter_id || null, +b.duration_min || 30, +b.negative_mark || 0, b.show_answers ? 1 : 0, b.state || 'DRAFT', b.starts_at || null, b.ends_at || null).lastInsertRowid; setBatches('test_batches', 'test_id', id, b.batch_ids); res.json({ item: db.prepare('SELECT * FROM tests WHERE id=?').get(id) }); });
app.put('/api/admin/tests/:id', (req, res) => { const b = req.body; db.prepare('UPDATE tests SET title=?,instructions=?,chapter_id=?,duration_min=?,negative_mark=?,show_answers=?,state=?,starts_at=?,ends_at=? WHERE id=?').run(b.title, b.instructions, b.chapter_id || null, +b.duration_min || 30, +b.negative_mark || 0, b.show_answers ? 1 : 0, b.state, b.starts_at || null, b.ends_at || null, +req.params.id); if (b.batch_ids) setBatches('test_batches', 'test_id', +req.params.id, b.batch_ids); res.json({ ok: true }); });
app.delete('/api/admin/tests/:id', (req, res) => { db.prepare('DELETE FROM tests WHERE id=?').run(+req.params.id); res.json({ ok: true }); });
app.get('/api/admin/tests/:id/questions', (req, res) => res.json({ items: db.prepare('SELECT * FROM questions WHERE test_id=? ORDER BY sort').all(+req.params.id).map(q => ({ ...q, options: JSON.parse(q.options) })) }));
app.post('/api/admin/tests/:id/questions', (req, res) => { const b = req.body; if (!isValidMcq(b)) return res.status(400).json({ error: 'Question, at least 2 non-empty options and a valid correct option are required' }); const id = db.prepare('INSERT INTO questions(test_id,text,options,correct,marks,explanation,sort) VALUES(?,?,?,?,?,?,?)').run(+req.params.id, b.text, JSON.stringify(b.options), +b.correct, +b.marks || 1, b.explanation || '', +b.sort || 0).lastInsertRowid; res.json({ item: db.prepare('SELECT * FROM questions WHERE id=?').get(id) }); });
app.put('/api/admin/questions/:id', (req, res) => { const b = req.body; if (!isValidMcq(b)) return res.status(400).json({ error: 'Question, at least 2 non-empty options and a valid correct option are required' }); db.prepare('UPDATE questions SET text=?,options=?,correct=?,marks=?,explanation=? WHERE id=?').run(b.text, JSON.stringify(b.options), +b.correct, +b.marks || 1, b.explanation || '', +req.params.id); res.json({ ok: true }); });
app.delete('/api/admin/questions/:id', (req, res) => { db.prepare('DELETE FROM questions WHERE id=?').run(+req.params.id); res.json({ ok: true }); });
app.get('/api/admin/tests/:id/results', (req, res) => res.json({ results: db.prepare("SELECT a.*, u.name, u.mobile FROM test_attempts a JOIN users u ON u.id=a.student_id WHERE a.test_id=? AND a.status='SUBMITTED' ORDER BY a.score DESC").all(+req.params.id) }));
app.get('/api/admin/tests/:id/export.csv', (req, res) => {
  const rows = db.prepare("SELECT u.name,u.mobile,a.score,a.total,a.correct_cnt,a.wrong_cnt,a.skipped_cnt,a.time_taken_sec FROM test_attempts a JOIN users u ON u.id=a.student_id WHERE a.test_id=? AND a.status='SUBMITTED' ORDER BY a.score DESC").all(+req.params.id);
  const csvCell = value => {
    let text = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text; // prevent spreadsheet formula injection
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  };
  const csv = 'Name,Mobile,Score,Total,Correct,Wrong,Skipped,TimeSec\n' + rows.map(r => [r.name, r.mobile, r.score, r.total, r.correct_cnt, r.wrong_cnt, r.skipped_cnt, r.time_taken_sec].map(csvCell).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', 'attachment; filename=results.csv'); res.send(csv);
});
// Notifications & announcements admin
app.post('/api/admin/notifications', (req, res) => { const b = req.body; if (!b.title || !b.message) return res.status(400).json({ error: 'Title and message required' }); const id = notifyUsers([], b.title, b.message, b.target_type || 'ALL', b.target_id || null, req.user.id, b.scheduled_at || null); audit(req.user.id, 'NOTIFY', b.title, req); res.json({ id, recipients: resolveRecipients(b.target_type || 'ALL', b.target_id || null).length, note: b.scheduled_at ? 'Scheduled — will be sent automatically at the chosen time.' : 'Sent in-app + Web Push to subscribed devices.' }); });
app.get('/api/admin/notifications', (req, res) => res.json({ items: db.prepare('SELECT * FROM notifications ORDER BY id DESC LIMIT 100').all() }));
app.post('/api/admin/announcements', (req, res) => { const id = db.prepare('INSERT INTO announcements(title,body,batch_id,created_by) VALUES(?,?,?,?)').run(req.body.title, req.body.body, req.body.batch_id || null, req.user.id).lastInsertRowid; res.json({ item: db.prepare('SELECT * FROM announcements WHERE id=?').get(id) }); });
app.delete('/api/admin/announcements/:id', (req, res) => { db.prepare('DELETE FROM announcements WHERE id=?').run(+req.params.id); res.json({ ok: true }); });
// Settings & teachers
app.get('/api/admin/settings', (req, res) => res.json({ approval_mode: getSetting('approval_mode', 'MANUAL') }));
app.put('/api/admin/settings', superOnly, (req, res) => { setSetting('approval_mode', req.body.approval_mode === 'AUTO' ? 'AUTO' : 'MANUAL'); res.json({ ok: true }); });
app.get('/api/admin/teachers', superOnly, (req, res) => res.json({ items: db.prepare("SELECT id,name,email,role,status,created_at FROM users WHERE role IN ('SUPER_ADMIN','TEACHER')").all() }));
app.post('/api/admin/teachers', superOnly, (req, res) => { const name = String(req.body?.name || '').trim(); const email = normalizeEmail(req.body?.email); const password = String(req.body?.password || ''); if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) return res.status(400).json({ error: 'Name, a valid email and a password of 12+ characters are required' }); if (db.prepare('SELECT 1 FROM users WHERE lower(email)=?').get(email)) return res.status(400).json({ error: 'Email already registered' }); const id = db.prepare("INSERT INTO users(role,name,email,password_hash,status) VALUES('TEACHER',?,?,?,'APPROVED')").run(name, email, bcrypt.hashSync(password, 10)).lastInsertRowid; audit(req.user.id, 'TEACHER_CREATED', email, req); res.json({ id }); });
app.get('/api/admin/audit', superOnly, (req, res) => res.json({ items: db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100').all() }));

// Practice questions admin CRUD
app.get('/api/admin/practice', (req, res) => {
  const q = req.query.chapter_id ? db.prepare('SELECT * FROM practice_questions WHERE chapter_id=? ORDER BY sort').all(+req.query.chapter_id) : db.prepare('SELECT * FROM practice_questions ORDER BY chapter_id,sort').all();
  res.json({ items: q.map(x => ({ ...x, options: JSON.parse(x.options) })) });
});
app.post('/api/admin/practice', (req, res) => { const b = req.body; if (!b.chapter_id || !isValidMcq(b)) return res.status(400).json({ error: 'Chapter, question, at least 2 non-empty options and a valid correct option are required' }); const id = db.prepare('INSERT INTO practice_questions(chapter_id,text,options,correct,explanation,sort,published) VALUES(?,?,?,?,?,?,?)').run(+b.chapter_id, b.text, JSON.stringify(b.options), +b.correct || 0, b.explanation || '', +b.sort || 0, b.published === 0 ? 0 : 1).lastInsertRowid; res.json({ item: db.prepare('SELECT * FROM practice_questions WHERE id=?').get(id) }); });
app.put('/api/admin/practice/:id', (req, res) => { const b = req.body; if (!isValidMcq(b)) return res.status(400).json({ error: 'Question, at least 2 non-empty options and a valid correct option are required' }); db.prepare('UPDATE practice_questions SET chapter_id=?,text=?,options=?,correct=?,explanation=?,sort=?,published=? WHERE id=?').run(b.chapter_id || null, b.text, JSON.stringify(b.options), +b.correct || 0, b.explanation || '', +b.sort || 0, b.published ? 1 : 0, +req.params.id); res.json({ ok: true }); });
app.delete('/api/admin/practice/:id', (req, res) => { db.prepare('DELETE FROM practice_questions WHERE id=?').run(+req.params.id); res.json({ ok: true }); });
// Weekly activity (last 7 days, real records only)
app.get('/api/admin/weekly', (req, res) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    days.push({
      date: d,
      registrations: db.prepare("SELECT COUNT(*) n FROM users WHERE role='STUDENT' AND date(created_at)=date(?)").get(d).n,
      submissions: db.prepare("SELECT COUNT(*) n FROM test_attempts WHERE status='SUBMITTED' AND date(submitted_at/1000,'unixepoch')=date(?)").get(d).n,
      doubts: db.prepare('SELECT COUNT(*) n FROM doubts WHERE date(created_at)=date(?)').get(d).n
    });
  }
  res.json({ days });
});
// Admin account security + backup
app.post('/api/admin/change-password', (req, res) => {
  const { current, next } = req.body || {};
  if (!req.user.password_hash || !bcrypt.compareSync(String(current || ''), req.user.password_hash)) return res.status(400).json({ error: 'Current password is wrong' });
  if (!next || String(next).length < 12) return res.status(400).json({ error: 'New password must be at least 12 characters' });
  if (String(next) === String(current || '')) return res.status(400).json({ error: 'New password must be different from the current password' });
  db.prepare('UPDATE users SET password_hash=?, session_token_version=session_token_version+1 WHERE id=?').run(bcrypt.hashSync(String(next), 10), req.user.id);
  audit(req.user.id, 'PASSWORD_CHANGED', req.user.email, req);
  res.json({ ok: true, note: 'Password changed. Please login again.' });
});
app.get('/api/admin/backup.db', superOnly, (req, res) => {
  try { db.exec('PRAGMA wal_checkpoint(TRUNCATE)'); } catch {}
  audit(req.user.id, 'DB_BACKUP_DOWNLOAD', '', req);
  res.download(dbPath, 'dream-classes-backup.db');
});

app.get('/api/admin/config-status', (req, res) => {
  const warnings = [...CONFIG_WARNINGS];
  try { const sa = db.prepare("SELECT password_hash FROM users WHERE role='SUPER_ADMIN' ORDER BY id LIMIT 1").get(); if (sa && bcrypt.compareSync('Dream@12345', sa.password_hash)) warnings.push('Super Admin is still using the DEFAULT password — change it now (Settings → Change My Password).'); } catch {}
  const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  if (proto !== 'https' && process.env.NODE_ENV === 'production') warnings.push('Requests are not arriving over HTTPS — put the app behind an HTTPS reverse proxy (Caddy/Nginx) before real students use it.');
  res.json({
    studentAuthMode: STUDENT_AUTH_MODE,
    otpLoginEnabled: OTP_LOGIN_ENABLED,
    smsRequired: OTP_LOGIN_ENABLED,
    otpMode: !OTP_LOGIN_ENABLED ? 'DISABLED (NAME LOGIN)' : (LOCAL_OTP_MODE ? 'LOCAL TEST ONLY' : (SMS_CONFIG.configured ? 'PRODUCTION SMS' : 'NOT CONFIGURED')),
    smsProvider: SMS_CONFIG.provider || null,
    smsConfigured: SMS_CONFIG.configured,
    msg91Configured: SMS_CONFIG.msg91Configured,
    twoFactorConfigured: SMS_CONFIG.twoFactorConfigured,
    jwtSecretFromEnv: !!process.env.JWT_SECRET,
    storage: { customDataDirectoryConfigured: usingCustomStorage, persistentDiskRequired: IS_PRODUCTION && !usingCustomStorage },
    webPushReady: !!VAPID_PUBLIC,
    https: proto === 'https',
    approvalMode: getSetting('approval_mode', 'MANUAL'),
    warnings
  });
});
app.get('/api/health', (req, res) => res.json({ ok: true, app: 'Dream Classes', time: new Date().toISOString() }));
app.use('/api', (req, res) => res.status(404).json({ error: 'API not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  const message = String(err.message || '');
  const isBadRequest = err instanceof multer.MulterError || err.type === 'entity.parse.failed' || err.type === 'entity.too.large' || /File type not allowed|Unexpected field/i.test(message);
  res.status(isBadRequest ? 400 : 500).json({ error: isBadRequest ? message : 'Something went wrong on the server. Please try again.' });
});

if (require.main === module) app.listen(PORT, '0.0.0.0', () => { console.log(`\n🎓 DREAM CLASSES running → http://0.0.0.0:${PORT}\n   Student App: /  |  Teacher Panel: /admin\n`); CONFIG_WARNINGS.forEach(w => console.warn('⚠️  CONFIG:', w)); });
module.exports = app;
