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
const { db, getSetting, setSetting } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION_' + crypto.createHash('sha256').update(__dirname).digest('hex').slice(0, 16);
const DEV_OTP_MODE = process.env.OTP_MODE !== 'production'; // set OTP_MODE=production + SMS keys for real SMS

app.use(cors());
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
const sign = u => jwt.sign({ id: u.id, role: u.role, tv: u.session_token_version }, JWT_SECRET, { expiresIn: '7d' });

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : (req.query.token || '');
  if (!token) return res.status(401).json({ error: 'Login required' });
  try {
    const p = jwt.verify(token, JWT_SECRET);
    const u = db.prepare('SELECT * FROM users WHERE id=?').get(p.id);
    if (!u || u.session_token_version !== p.tv) return res.status(401).json({ error: 'Session expired. Please login again.' });
    if (u.status === 'BLOCKED' || u.status === 'SUSPENDED' || u.status === 'REJECTED') return res.status(403).json({ error: 'Account ' + u.status.toLowerCase() + '. Contact Dream Sir.' });
    req.user = u; next();
  } catch { return res.status(401).json({ error: 'Invalid or expired session' }); }
}
const adminOnly = (req, res, next) => (req.user.role === 'SUPER_ADMIN' || req.user.role === 'TEACHER') ? next() : res.status(403).json({ error: 'Admin access only' });
const superOnly = (req, res, next) => req.user.role === 'SUPER_ADMIN' ? next() : res.status(403).json({ error: 'Super Admin only' });
const studentActive = (req, res, next) => {
  if (req.user.role !== 'STUDENT') return next();
  if (req.user.status !== 'APPROVED') return res.status(403).json({ error: 'PENDING_APPROVAL', message: 'Your account is waiting for approval by Dream Sir.' });
  next();
};
// Batch access rule: empty batch list = all batches of that class allowed; else student batch must match.
function canAccess(table, itemId, user) {
  if (user.role !== 'STUDENT') return true;
  const rows = db.prepare(`SELECT batch_id FROM ${table} WHERE ${table === 'video_batches' ? 'video_id' : table === 'pdf_batches' ? 'pdf_id' : 'test_id'}=?`).all(itemId);
  if (!rows.length) return true;
  return rows.some(r => r.batch_id === user.batch_id);
}

// ---------- uploads ----------
function makeUpload(dir, types, mb) {
  fs.mkdirSync(path.join(__dirname, 'uploads', dir), { recursive: true });
  return multer({
    storage: multer.diskStorage({ destination: path.join(__dirname, 'uploads', dir), filename: (r, f, cb) => cb(null, Date.now() + '-' + crypto.randomBytes(4).toString('hex') + path.extname(f.originalname)) }),
    limits: { fileSize: mb * 1024 * 1024 },
    fileFilter: (r, f, cb) => types.test(path.extname(f.originalname).toLowerCase()) ? cb(null, true) : cb(new Error('File type not allowed'))
  });
}
const upVideo = makeUpload('videos', /\.(mp4|webm|mov|m3u8)$/, 500);
const upReply = makeUpload('images', /\.(jpg|jpeg|png|webp|pdf)$/, 25); // doubt replies: image or PDF solution
const upPdf = makeUpload('pdfs', /\.pdf$/, 50);
const upImg = makeUpload('images', /\.(jpg|jpeg|png|webp)$/, 8);
const upThumb = makeUpload('thumbs', /\.(jpg|jpeg|png|webp)$/, 5);

// ---------- OTP AUTH (students) ----------
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 8, message: { error: 'Too many OTP requests. Try after some time.' } });
app.post('/api/auth/request-otp', otpLimiter, (req, res) => {
  const mobile = String(req.body.mobile || '').replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(mobile)) return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number' });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  db.prepare('DELETE FROM otps WHERE mobile=?').run(mobile);
  db.prepare('INSERT INTO otps(mobile,code_hash,expires_at,created_at) VALUES(?,?,?,?)').run(mobile, bcrypt.hashSync(code, 8), Date.now() + 5 * 60 * 1000, Date.now());
  audit(null, 'OTP_REQUEST', maskMobile(mobile), req);
  // PRODUCTION: send via MSG91/Twilio/WhatsApp Business API here (see README). Dev mode returns code for testing.
  if (DEV_OTP_MODE) return res.json({ ok: true, devOtp: code, note: 'DEV MODE: OTP shown here only for testing. Configure SMS/WhatsApp provider for production.' });
  res.json({ ok: true, note: 'OTP sent to your mobile number.' });
});
app.post('/api/auth/verify-otp', (req, res) => {
  const mobile = String(req.body.mobile || '').replace(/\D/g, ''), code = String(req.body.code || ''), name = String(req.body.name || '').trim(), classId = req.body.class_id || null, deviceId = String(req.body.device_id || 'web');
  const row = db.prepare('SELECT * FROM otps WHERE mobile=? ORDER BY id DESC').get(mobile);
  if (!row || row.expires_at < Date.now()) return res.status(400).json({ error: 'OTP expired. Request a new OTP.' });
  if (row.attempts >= 5) return res.status(429).json({ error: 'Too many wrong attempts. Request a new OTP.' });
  if (!bcrypt.compareSync(code, row.code_hash)) { db.prepare('UPDATE otps SET attempts=attempts+1 WHERE id=?').run(row.id); return res.status(400).json({ error: 'Incorrect OTP' }); }
  db.prepare('DELETE FROM otps WHERE mobile=?').run(mobile);
  let user = db.prepare('SELECT * FROM users WHERE mobile=? AND role=?').get(mobile, 'STUDENT');
  if (!user) {
    if (!name) return res.status(400).json({ error: 'NEW_USER_NAME_REQUIRED', message: 'New student — please enter your full name.' });
    const status = getSetting('approval_mode', 'MANUAL') === 'AUTO' ? 'APPROVED' : 'PENDING';
    const id = db.prepare('INSERT INTO users(role,name,mobile,status,class_id,device_id) VALUES(?,?,?,?,?,?)').run('STUDENT', name, mobile, status, classId, deviceId).lastInsertRowid;
    user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
    audit(user.id, 'REGISTER', name, req);
  }
  if (user.status === 'BLOCKED' || user.status === 'SUSPENDED' || user.status === 'REJECTED') return res.status(403).json({ error: 'Account ' + user.status.toLowerCase() + '. Please contact Dream Sir.' });
  // Single-device enforcement: bump token version (old device logged out)
  db.prepare('UPDATE users SET session_token_version=session_token_version+1, device_id=?, last_login=datetime(?) WHERE id=?').run(deviceId, 'now', user.id);
  user = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
  audit(user.id, 'LOGIN', 'OTP', req);
  res.json({ token: sign(user), user: publicUser(user) });
});
// ---------- ADMIN AUTH ----------
app.post('/api/auth/admin-login', otpLimiter, (req, res) => {
  const { email, password } = req.body || {};
  const u = db.prepare('SELECT * FROM users WHERE email=? AND role IN (?,?)').get(String(email || '').toLowerCase(), 'SUPER_ADMIN', 'TEACHER');
  if (!u || !u.password_hash || !bcrypt.compareSync(String(password || ''), u.password_hash)) return res.status(401).json({ error: 'Invalid email or password' });
  db.prepare('UPDATE users SET last_login=datetime(?) WHERE id=?').run('now', u.id);
  audit(u.id, 'ADMIN_LOGIN', u.email, req);
  res.json({ token: sign(u), user: publicUser(u) });
});
app.get('/api/auth/me', auth, (req, res) => res.json({ user: publicUser(req.user), settings: { approval_mode: getSetting('approval_mode', 'MANUAL') } }));
app.post('/api/auth/logout', auth, (req, res) => { db.prepare('UPDATE users SET session_token_version=session_token_version+1 WHERE id=?').run(req.user.id); audit(req.user.id, 'LOGOUT', '', req); res.json({ ok: true }); });
app.put('/api/auth/profile', auth, (req, res) => {
  const { name, class_id, fcm_token } = req.body || {};
  db.prepare('UPDATE users SET name=COALESCE(?,name), class_id=COALESCE(?,class_id), fcm_token=COALESCE(?,fcm_token) WHERE id=?').run(name || null, class_id || null, fcm_token || null, req.user.id);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id)) });
});
app.post('/api/auth/photo', auth, upImg.single('photo'), (req, res) => { if (!req.file) return res.status(400).json({ error: 'No photo uploaded' }); const p = '/uploads/images/' + req.file.filename; db.prepare('UPDATE users SET photo=? WHERE id=?').run(p, req.user.id); res.json({ photo: p }); });
app.delete('/api/auth/account', auth, (req, res) => { db.prepare('DELETE FROM users WHERE id=?').run(req.user.id); audit(req.user.id, 'ACCOUNT_DELETED', req.user.name, req); res.json({ ok: true }); });
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads', 'images')));
app.use('/uploads/thumbs', express.static(path.join(__dirname, 'uploads', 'thumbs')));

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
app.get('/api/chapters/:id/content', auth, studentActive, (req, res) => res.json(chapterContent(+req.params.id, req.user)));

// Signed, short-lived playback token (5 min)
app.get('/api/videos/:id/play', auth, studentActive, (req, res) => {
  const v = db.prepare('SELECT * FROM videos WHERE id=? AND published=1').get(+req.params.id);
  if (!v) return res.status(404).json({ error: 'Video not found' });
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
  const file = path.join(__dirname, v.file_path);
  if (!fs.existsSync(file)) return res.status(404).end();
  const stat = fs.statSync(file), range = req.headers.range;
  if (!range) { res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': 'video/mp4' }); return fs.createReadStream(file).pipe(res); }
  const [s, e] = range.replace(/bytes=/, '').split('-');
  const start = parseInt(s), end = e ? parseInt(e) : stat.size - 1;
  res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Content-Type': 'video/mp4' });
  fs.createReadStream(file, { start, end }).pipe(res);
});
app.post('/api/progress', auth, studentActive, (req, res) => {
  const { video_id, position_sec, completed } = req.body || {};
  db.prepare('INSERT INTO progress(student_id,video_id,position_sec,completed) VALUES(?,?,?,?) ON CONFLICT(student_id,video_id) DO UPDATE SET position_sec=excluded.position_sec, completed=MAX(completed,excluded.completed), updated_at=datetime(?)')
    .run(req.user.id, +video_id, Math.floor(position_sec || 0), completed ? 1 : 0, 'now');
  res.json({ ok: true });
});
app.get('/api/pdfs/:id/file', auth, studentActive, async (req, res) => {
  const p = db.prepare('SELECT * FROM pdf_notes WHERE id=? AND published=1').get(+req.params.id);
  if (!p) return res.status(404).json({ error: 'Notes not found' });
  if (!canAccess('pdf_batches', p.id, req.user)) return res.status(403).json({ error: 'Not assigned to your batch.' });
  if (req.query.download && !p.downloadable && req.user.role === 'STUDENT') return res.status(403).json({ error: 'Download is disabled for these notes.' });
  if (p.url) return res.redirect(p.url);
  const file = path.join(__dirname, p.file_path || '');
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
app.post('/api/pdfs/:id/progress', auth, studentActive, (req, res) => { db.prepare('INSERT INTO pdf_progress(student_id,pdf_id,page) VALUES(?,?,?) ON CONFLICT(student_id,pdf_id) DO UPDATE SET page=excluded.page').run(req.user.id, +req.params.id, +req.body.page || 1); res.json({ ok: true }); });
app.get('/api/pdfs/:id/progress', auth, (req, res) => res.json(db.prepare('SELECT page FROM pdf_progress WHERE student_id=? AND pdf_id=?').get(req.user.id, +req.params.id) || { page: 1 }));

// ---------- TESTS (server-side scoring; answers never sent before review) ----------
app.get('/api/tests', auth, studentActive, (req, res) => {
  const tests = db.prepare("SELECT t.*, c.name chapter_name, s.name subject_name FROM tests t LEFT JOIN chapters c ON c.id=t.chapter_id LEFT JOIN subjects s ON s.id=c.subject_id WHERE t.state IN ('PUBLISHED','SCHEDULED','CLOSED') ORDER BY t.id DESC").all()
    .filter(t => canAccess('test_batches', t.id, req.user))
    .map(t => ({ ...t, questionCount: db.prepare('SELECT COUNT(*) n FROM questions WHERE test_id=?').get(t.id).n, myAttempt: db.prepare("SELECT id,score,total,status,submitted_at FROM test_attempts WHERE test_id=? AND student_id=? AND status='SUBMITTED'").get(t.id, req.user.id) || null }));
  res.json({ tests });
});
app.post('/api/tests/:id/start', auth, studentActive, (req, res) => {
  const t = db.prepare('SELECT * FROM tests WHERE id=?').get(+req.params.id);
  if (!t || t.state !== 'PUBLISHED') return res.status(400).json({ error: 'Test is not open yet.' });
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
  const answers = req.body.answers || JSON.parse(a.answers || '{}');
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
app.get('/api/tests/attempts/:id/review', auth, (req, res) => {
  const a = db.prepare('SELECT * FROM test_attempts WHERE id=?').get(+req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'STUDENT' && a.student_id !== req.user.id) return res.status(403).json({ error: 'Not your result' });
  const t = db.prepare('SELECT * FROM tests WHERE id=?').get(a.test_id);
  const answers = JSON.parse(a.answers || '{}');
  const qs = db.prepare('SELECT * FROM questions WHERE test_id=? ORDER BY sort').all(a.test_id).map(q => ({ id: q.id, text: q.text, options: JSON.parse(q.options), marks: q.marks, selected: answers[q.id] !== undefined ? +answers[q.id] : null, ...(t.show_answers || req.user.role !== 'STUDENT' ? { correct: q.correct, explanation: q.explanation } : {}) }));
  res.json({ test: { title: t.title, show_answers: !!t.show_answers }, attempt: a, questions: qs });
});
app.get('/api/my/results', auth, (req, res) => res.json({ results: db.prepare("SELECT a.*, t.title FROM test_attempts a JOIN tests t ON t.id=a.test_id WHERE a.student_id=? AND a.status='SUBMITTED' ORDER BY a.submitted_at DESC").all(req.user.id) }));

// ---------- DOUBTS ----------
app.get('/api/doubts', auth, (req, res) => {
  const rows = req.user.role === 'STUDENT'
    ? db.prepare('SELECT d.*, u.name student_name FROM doubts d JOIN users u ON u.id=d.student_id WHERE d.student_id=? ORDER BY d.id DESC').all(req.user.id)
    : db.prepare('SELECT d.*, u.name student_name, u.mobile FROM doubts d JOIN users u ON u.id=d.student_id ORDER BY d.id DESC').all();
  res.json({ doubts: rows.map(d => ({ ...d, replies: db.prepare('SELECT * FROM doubt_replies WHERE doubt_id=? ORDER BY id').all(d.id) })) });
});
app.post('/api/doubts', auth, studentActive, upImg.single('image'), (req, res) => {
  const q = String(req.body.question || '').trim();
  if (!q) return res.status(400).json({ error: 'Write your question' });
  const id = db.prepare('INSERT INTO doubts(student_id,chapter_id,subject_id,class_id,question,image) VALUES(?,?,?,?,?,?)').run(req.user.id, req.body.chapter_id || null, req.body.subject_id || null, req.body.class_id || null, q, req.file ? '/uploads/images/' + req.file.filename : null).lastInsertRowid;
  res.json({ doubt: db.prepare('SELECT * FROM doubts WHERE id=?').get(id) });
});
app.post('/api/doubts/:id/reply', auth, upReply.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), (req, res) => {
  const d = db.prepare('SELECT * FROM doubts WHERE id=?').get(+req.params.id);
  if (!d) return res.status(404).json({ error: 'Doubt not found' });
  if (req.user.role === 'STUDENT' && d.student_id !== req.user.id) return res.status(403).json({ error: 'Not your doubt' });
  const img = req.files?.image?.[0], pdf = req.files?.pdf?.[0];
  db.prepare('INSERT INTO doubt_replies(doubt_id,author_id,author_role,text,image,pdf) VALUES(?,?,?,?,?,?)').run(d.id, req.user.id, req.user.role, String(req.body.text || ''), img ? '/uploads/images/' + img.filename : null, pdf ? '/uploads/images/' + pdf.filename : null);
  const status = req.body.status && ['PENDING', 'IN_PROGRESS', 'ANSWERED', 'RESOLVED'].includes(req.body.status) ? req.body.status : (req.user.role === 'STUDENT' ? 'PENDING' : 'ANSWERED');
  db.prepare("UPDATE doubts SET status=?, updated_at=datetime('now') WHERE id=?").run(status, d.id);
  if (req.user.role !== 'STUDENT') notifyUsers([d.student_id], 'Doubt Answered 💬', 'Dream Sir has answered your doubt.', 'STUDENT', d.student_id, req.user.id);
  res.json({ ok: true });
});
app.put('/api/doubts/:id/status', auth, (req, res) => {
  const d = db.prepare('SELECT * FROM doubts WHERE id=?').get(+req.params.id);
  if (!d || (req.user.role === 'STUDENT' && d.student_id !== req.user.id)) return res.status(403).json({ error: 'Not allowed' });
  db.prepare("UPDATE doubts SET status=?, updated_at=datetime('now') WHERE id=?").run(req.body.status, d.id);
  res.json({ ok: true });
});

// ---------- NOTIFICATIONS / ANNOUNCEMENTS ----------
function notifyUsers(userIds, title, message, targetType, targetId, by, scheduledAt) {
  const isFuture = scheduledAt && new Date(scheduledAt) > new Date();
  const id = db.prepare('INSERT INTO notifications(title,message,target_type,target_id,sent_by,status,scheduled_at) VALUES(?,?,?,?,?,?,?)')
    .run(title, message, targetType, targetId || null, by, isFuture ? 'SCHEDULED' : 'SENT', scheduledAt || null).lastInsertRowid;
  if (!isFuture) {
    const recipients = (userIds && userIds.length) ? userIds : resolveRecipients(targetType, targetId);
    sendPush(recipients, title, message).catch(() => {}); // Web Push (VAPID); in-app copy always saved above
  }
  return id;
}
// Scheduled-notification dispatcher (runs every 30s)
setInterval(() => {
  try {
    const due = db.prepare("SELECT * FROM notifications WHERE status='SCHEDULED' AND scheduled_at<=datetime('now','localtime')").all();
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
app.post('/api/push/subscribe', auth, (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (!endpoint || !keys) return res.status(400).json({ error: 'Invalid subscription' });
  db.prepare('INSERT INTO push_subscriptions(user_id,endpoint,keys) VALUES(?,?,?) ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id, keys=excluded.keys')
    .run(req.user.id, endpoint, JSON.stringify(keys));
  res.json({ ok: true });
});
app.post('/api/push/unsubscribe', auth, (req, res) => { db.prepare('DELETE FROM push_subscriptions WHERE user_id=? AND endpoint=?').run(req.user.id, String((req.body || {}).endpoint || '')); res.json({ ok: true }); });
app.get('/api/notifications', auth, (req, res) => res.json({ notifications: visibleNotifications(req.user) }));
app.post('/api/notifications/:id/read', auth, (req, res) => { db.prepare('INSERT OR IGNORE INTO notification_reads VALUES(?,?)').run(+req.params.id, req.user.id); res.json({ ok: true }); });
app.get('/api/announcements', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM announcements ORDER BY id DESC LIMIT 50').all();
  res.json({ announcements: req.user.role === 'STUDENT' ? rows.filter(a => !a.batch_id || a.batch_id === req.user.batch_id) : rows });
});

// ---------- STUDENT DASHBOARD / ANALYTICS ----------
app.get('/api/dashboard', auth, (req, res) => {
  const uid = req.user.id;
  const totalVideos = db.prepare('SELECT COUNT(*) n FROM videos WHERE published=1').get().n;
  const completed = db.prepare('SELECT COUNT(*) n FROM progress WHERE student_id=? AND completed=1').get(uid).n;
  const recent = db.prepare('SELECT v.id,v.title,v.thumbnail,p.position_sec,p.completed FROM progress p JOIN videos v ON v.id=p.video_id WHERE p.student_id=? ORDER BY p.updated_at DESC LIMIT 5').all(uid);
  const results = db.prepare("SELECT a.score,a.total,t.title FROM test_attempts a JOIN tests t ON t.id=a.test_id WHERE a.student_id=? AND a.status='SUBMITTED' ORDER BY a.submitted_at DESC LIMIT 5").all(uid);
  const agg = db.prepare("SELECT COUNT(*) attempts, AVG(CASE WHEN total>0 THEN score*100.0/total END) avgPct, MAX(CASE WHEN total>0 THEN score*100.0/total END) bestPct FROM test_attempts WHERE student_id=? AND status='SUBMITTED'").get(uid);
  res.json({
    totalVideos, completed, coursePct: totalVideos ? Math.round(completed / totalVideos * 100) : 0,
    recent, results, attempts: agg.attempts || 0, avgPct: Math.round(agg.avgPct || 0), bestPct: Math.round(agg.bestPct || 0),
    pendingDoubts: db.prepare("SELECT COUNT(*) n FROM doubts WHERE student_id=? AND status IN ('PENDING','IN_PROGRESS')").get(uid).n,
    resolvedDoubts: db.prepare("SELECT COUNT(*) n FROM doubts WHERE student_id=? AND status='RESOLVED'").get(uid).n,
    latestNotes: db.prepare('SELECT id,title,downloadable,created_at FROM pdf_notes WHERE published=1 ORDER BY id DESC LIMIT 5').all(),
    upcomingTests: db.prepare("SELECT t.id,t.title,t.state,t.starts_at,t.duration_min FROM tests t WHERE t.state IN ('PUBLISHED','SCHEDULED') AND NOT EXISTS (SELECT 1 FROM test_attempts a WHERE a.test_id=t.id AND a.student_id=? AND a.status='SUBMITTED') ORDER BY COALESCE(t.starts_at,'') LIMIT 5").all(uid)
      .filter(t => canAccess('test_batches', t.id, req.user)),
    subjectPerformance: db.prepare(`SELECT s.name subject, COUNT(*) attempts, ROUND(AVG(CASE WHEN a.total>0 THEN a.score*100.0/a.total END)) pct
      FROM test_attempts a JOIN tests t ON t.id=a.test_id JOIN chapters c ON c.id=t.chapter_id JOIN subjects s ON s.id=c.subject_id
      WHERE a.student_id=? AND a.status='SUBMITTED' GROUP BY s.id ORDER BY s.name`).all(uid),
    practice: db.prepare('SELECT COUNT(*) answered, COALESCE(SUM(correct),0) correct FROM practice_answers WHERE student_id=?').get(uid)
  });
});

// ---------- PRACTICE QUESTIONS (untimed, instant server-checked feedback) ----------
app.get('/api/chapters/:id/practice', auth, studentActive, (req, res) => {
  const qs = db.prepare('SELECT id,text,options FROM practice_questions WHERE chapter_id=? AND published=1 ORDER BY sort').all(+req.params.id)
    .map(q => ({ ...q, options: JSON.parse(q.options), answered: req.user.role === 'STUDENT' ? (db.prepare('SELECT correct FROM practice_answers WHERE student_id=? AND question_id=?').get(req.user.id, q.id)?.correct ?? null) : null }));
  res.json({ questions: qs });
});
app.post('/api/practice/:id/check', auth, studentActive, (req, res) => {
  const q = db.prepare('SELECT * FROM practice_questions WHERE id=? AND published=1').get(+req.params.id);
  if (!q) return res.status(404).json({ error: 'Question not found' });
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
  list: (req, res) => res.json({ items: db.prepare(`SELECT * FROM ${table} ORDER BY COALESCE(sort,0), id`).all() }),
  create: (req, res) => { const f = fields.filter(k => req.body[k] !== undefined); const id = db.prepare(`INSERT INTO ${table}(${f.join(',')}) VALUES(${f.map(() => '?').join(',')})`).run(...f.map(k => req.body[k])).lastInsertRowid; audit(req.user.id, 'CREATE_' + table, JSON.stringify(req.body), req); res.json({ item: db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id) }); },
  update: (req, res) => { const f = fields.filter(k => req.body[k] !== undefined); db.prepare(`UPDATE ${table} SET ${f.map(k => k + '=?').join(',')} WHERE id=?`).run(...f.map(k => req.body[k]), +req.params.id); res.json({ item: db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(+req.params.id) }); },
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
  res.json({ students: db.prepare(q + ' ORDER BY u.id DESC').all(...p).map(publicUser) });
});
app.put('/api/admin/students/:id', (req, res) => {
  const { status, batch_id, class_id } = req.body || {};
  db.prepare('UPDATE users SET status=COALESCE(?,status), batch_id=COALESCE(?,batch_id), class_id=COALESCE(?,class_id) WHERE id=?').run(status || null, batch_id ?? null, class_id ?? null, +req.params.id);
  if (status) audit(req.user.id, 'STUDENT_' + status, req.params.id, req);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(+req.params.id)) });
});
app.post('/api/admin/students/:id/revoke-session', (req, res) => { db.prepare('UPDATE users SET session_token_version=session_token_version+1 WHERE id=?').run(+req.params.id); res.json({ ok: true }); });
app.get('/api/admin/students/:id/progress', (req, res) => {
  const id = +req.params.id;
  res.json({ watched: db.prepare('SELECT v.title,p.completed,p.position_sec FROM progress p JOIN videos v ON v.id=p.video_id WHERE p.student_id=? ORDER BY p.updated_at DESC').all(id), results: db.prepare("SELECT t.title,a.score,a.total FROM test_attempts a JOIN tests t ON t.id=a.test_id WHERE a.student_id=? AND a.status='SUBMITTED'").all(id) });
});
// Videos / PDFs admin
function setBatches(table, col, id, batchIds) { db.prepare(`DELETE FROM ${table} WHERE ${col}=?`).run(id); (batchIds || []).forEach(b => db.prepare(`INSERT OR IGNORE INTO ${table} VALUES(?,?)`).run(id, +b)); }
const withBatches = (rows, table, col) => rows.map(r => ({ ...r, batch_ids: db.prepare(`SELECT batch_id FROM ${table} WHERE ${col}=?`).all(r.id).map(x => x.batch_id) }));
app.get('/api/admin/videos', (req, res) => res.json({ items: withBatches(db.prepare('SELECT * FROM videos ORDER BY sort,id DESC').all(), 'video_batches', 'video_id') }));
app.post('/api/admin/videos', upVideo.single('file'), (req, res) => {
  const b = req.body;
  let qualities = '[]'; try { const q = JSON.parse(b.qualities || '[]'); if (Array.isArray(q)) qualities = JSON.stringify(q.filter(x => x && x.label && x.url)); } catch {}
  const id = db.prepare('INSERT INTO videos(title,description,chapter_id,source_type,url,file_path,thumbnail,qualities,downloadable,published,sort) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .run(b.title, b.description || '', b.chapter_id || null, req.file ? 'upload' : (b.source_type || 'url'), b.url || null, req.file ? 'uploads/videos/' + req.file.filename : null, b.thumbnail || null, qualities, b.downloadable ? 1 : 0, b.published ? 1 : 0, +b.sort || 0).lastInsertRowid;
  setBatches('video_batches', 'video_id', id, JSON.parse(b.batch_ids || '[]'));
  audit(req.user.id, 'VIDEO_UPLOAD', b.title, req);
  res.json({ item: db.prepare('SELECT * FROM videos WHERE id=?').get(id) });
});
app.put('/api/admin/videos/:id', (req, res) => { const b = req.body; let qualities = undefined; if (b.qualities !== undefined) { try { qualities = JSON.stringify((Array.isArray(b.qualities) ? b.qualities : JSON.parse(b.qualities)).filter(x => x && x.label && x.url)); } catch { qualities = '[]'; } } db.prepare('UPDATE videos SET title=?,description=?,chapter_id=?,url=?,source_type=?,thumbnail=COALESCE(?,thumbnail),qualities=COALESCE(?,qualities),downloadable=?,published=?,sort=? WHERE id=?').run(b.title, b.description, b.chapter_id || null, b.url || null, b.source_type || 'url', b.thumbnail || null, qualities ?? null, b.downloadable ? 1 : 0, b.published ? 1 : 0, +b.sort || 0, +req.params.id); if (b.batch_ids) setBatches('video_batches', 'video_id', +req.params.id, b.batch_ids); res.json({ ok: true }); });
app.delete('/api/admin/videos/:id', (req, res) => { const v = db.prepare('SELECT * FROM videos WHERE id=?').get(+req.params.id); if (v?.file_path) fs.unlink(path.join(__dirname, v.file_path), () => {}); db.prepare('DELETE FROM videos WHERE id=?').run(+req.params.id); res.json({ ok: true }); });
app.post('/api/admin/thumbnail', upThumb.single('file'), (req, res) => res.json({ path: '/uploads/thumbs/' + req.file.filename }));
app.get('/api/admin/pdfs', (req, res) => res.json({ items: withBatches(db.prepare('SELECT * FROM pdf_notes ORDER BY sort,id DESC').all(), 'pdf_batches', 'pdf_id') }));
app.post('/api/admin/pdfs', upPdf.array('files', 10), (req, res) => {
  const b = req.body, created = [];
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
app.delete('/api/admin/pdfs/:id', (req, res) => { const p = db.prepare('SELECT * FROM pdf_notes WHERE id=?').get(+req.params.id); if (p?.file_path) fs.unlink(path.join(__dirname, p.file_path), () => {}); db.prepare('DELETE FROM pdf_notes WHERE id=?').run(+req.params.id); res.json({ ok: true }); });
// Tests admin
app.get('/api/admin/tests', (req, res) => res.json({ items: withBatches(db.prepare('SELECT * FROM tests ORDER BY id DESC').all(), 'test_batches', 'test_id').map(t => ({ ...t, questionCount: db.prepare('SELECT COUNT(*) n FROM questions WHERE test_id=?').get(t.id).n })) }));
app.post('/api/admin/tests', (req, res) => { const b = req.body; const id = db.prepare('INSERT INTO tests(title,instructions,chapter_id,duration_min,negative_mark,show_answers,state,starts_at,ends_at) VALUES(?,?,?,?,?,?,?,?,?)').run(b.title, b.instructions || '', b.chapter_id || null, +b.duration_min || 30, +b.negative_mark || 0, b.show_answers ? 1 : 0, b.state || 'DRAFT', b.starts_at || null, b.ends_at || null).lastInsertRowid; setBatches('test_batches', 'test_id', id, b.batch_ids); res.json({ item: db.prepare('SELECT * FROM tests WHERE id=?').get(id) }); });
app.put('/api/admin/tests/:id', (req, res) => { const b = req.body; db.prepare('UPDATE tests SET title=?,instructions=?,chapter_id=?,duration_min=?,negative_mark=?,show_answers=?,state=?,starts_at=?,ends_at=? WHERE id=?').run(b.title, b.instructions, b.chapter_id || null, +b.duration_min || 30, +b.negative_mark || 0, b.show_answers ? 1 : 0, b.state, b.starts_at || null, b.ends_at || null, +req.params.id); if (b.batch_ids) setBatches('test_batches', 'test_id', +req.params.id, b.batch_ids); res.json({ ok: true }); });
app.delete('/api/admin/tests/:id', (req, res) => { db.prepare('DELETE FROM tests WHERE id=?').run(+req.params.id); res.json({ ok: true }); });
app.get('/api/admin/tests/:id/questions', (req, res) => res.json({ items: db.prepare('SELECT * FROM questions WHERE test_id=? ORDER BY sort').all(+req.params.id).map(q => ({ ...q, options: JSON.parse(q.options) })) }));
app.post('/api/admin/tests/:id/questions', (req, res) => { const b = req.body; const id = db.prepare('INSERT INTO questions(test_id,text,options,correct,marks,explanation,sort) VALUES(?,?,?,?,?,?,?)').run(+req.params.id, b.text, JSON.stringify(b.options), +b.correct, +b.marks || 1, b.explanation || '', +b.sort || 0).lastInsertRowid; res.json({ item: db.prepare('SELECT * FROM questions WHERE id=?').get(id) }); });
app.put('/api/admin/questions/:id', (req, res) => { const b = req.body; db.prepare('UPDATE questions SET text=?,options=?,correct=?,marks=?,explanation=? WHERE id=?').run(b.text, JSON.stringify(b.options), +b.correct, +b.marks || 1, b.explanation || '', +req.params.id); res.json({ ok: true }); });
app.delete('/api/admin/questions/:id', (req, res) => { db.prepare('DELETE FROM questions WHERE id=?').run(+req.params.id); res.json({ ok: true }); });
app.get('/api/admin/tests/:id/results', (req, res) => res.json({ results: db.prepare("SELECT a.*, u.name, u.mobile FROM test_attempts a JOIN users u ON u.id=a.student_id WHERE a.test_id=? AND a.status='SUBMITTED' ORDER BY a.score DESC").all(+req.params.id) }));
app.get('/api/admin/tests/:id/export.csv', (req, res) => {
  const rows = db.prepare("SELECT u.name,u.mobile,a.score,a.total,a.correct_cnt,a.wrong_cnt,a.skipped_cnt,a.time_taken_sec FROM test_attempts a JOIN users u ON u.id=a.student_id WHERE a.test_id=? AND a.status='SUBMITTED' ORDER BY a.score DESC").all(+req.params.id);
  const csv = 'Name,Mobile,Score,Total,Correct,Wrong,Skipped,TimeSec\n' + rows.map(r => [r.name, r.mobile, r.score, r.total, r.correct_cnt, r.wrong_cnt, r.skipped_cnt, r.time_taken_sec].join(',')).join('\n');
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
app.post('/api/admin/teachers', superOnly, (req, res) => { const { name, email, password } = req.body; const id = db.prepare("INSERT INTO users(role,name,email,password_hash,status) VALUES('TEACHER',?,?,?,'APPROVED')").run(name, String(email).toLowerCase(), bcrypt.hashSync(password, 10)).lastInsertRowid; res.json({ id }); });
app.get('/api/admin/audit', superOnly, (req, res) => res.json({ items: db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100').all() }));

// Practice questions admin CRUD
app.get('/api/admin/practice', (req, res) => {
  const q = req.query.chapter_id ? db.prepare('SELECT * FROM practice_questions WHERE chapter_id=? ORDER BY sort').all(+req.query.chapter_id) : db.prepare('SELECT * FROM practice_questions ORDER BY chapter_id,sort').all();
  res.json({ items: q.map(x => ({ ...x, options: JSON.parse(x.options) })) });
});
app.post('/api/admin/practice', (req, res) => { const b = req.body; if (!b.chapter_id || !b.text || !Array.isArray(b.options) || b.options.length < 2) return res.status(400).json({ error: 'Chapter, question and at least 2 options required' }); const id = db.prepare('INSERT INTO practice_questions(chapter_id,text,options,correct,explanation,sort,published) VALUES(?,?,?,?,?,?,?)').run(+b.chapter_id, b.text, JSON.stringify(b.options), +b.correct || 0, b.explanation || '', +b.sort || 0, b.published === 0 ? 0 : 1).lastInsertRowid; res.json({ item: db.prepare('SELECT * FROM practice_questions WHERE id=?').get(id) }); });
app.put('/api/admin/practice/:id', (req, res) => { const b = req.body; db.prepare('UPDATE practice_questions SET chapter_id=?,text=?,options=?,correct=?,explanation=?,sort=?,published=? WHERE id=?').run(b.chapter_id || null, b.text, JSON.stringify(b.options), +b.correct || 0, b.explanation || '', +b.sort || 0, b.published ? 1 : 0, +req.params.id); res.json({ ok: true }); });
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
  if (!next || String(next).length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
  db.prepare('UPDATE users SET password_hash=?, session_token_version=session_token_version+1 WHERE id=?').run(bcrypt.hashSync(String(next), 10), req.user.id);
  audit(req.user.id, 'PASSWORD_CHANGED', req.user.email, req);
  res.json({ ok: true, note: 'Password changed. Please login again.' });
});
app.get('/api/admin/backup.db', superOnly, (req, res) => {
  try { db.exec('PRAGMA wal_checkpoint(TRUNCATE)'); } catch {}
  audit(req.user.id, 'DB_BACKUP_DOWNLOAD', '', req);
  res.download(path.join(__dirname, 'data', 'dream.db'), 'dream-classes-backup.db');
});

app.get('/api/health', (req, res) => res.json({ ok: true, app: 'Dream Classes', time: new Date().toISOString() }));
app.use((err, req, res, next) => { console.error(err); res.status(400).json({ error: err.message || 'Something went wrong' }); });

if (require.main === module) app.listen(PORT, '0.0.0.0', () => console.log(`\n🎓 DREAM CLASSES running → http://0.0.0.0:${PORT}\n   Student App: /  |  Teacher Panel: /admin\n`));
module.exports = app;
