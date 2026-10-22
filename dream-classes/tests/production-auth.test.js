// Production authentication regression tests:
// - OTP is not consumed before a new student's name is supplied
// - cooldown / expiry / max attempts / one-time use
// - production fails closed without SMS credentials (no demo OTP)
// - MSG91/2Factor response-body handling with mocked fetch (no SMS credits)
// - teacher setup/reset, case-insensitive login, logout revocation, file tokens
const fs = require('fs');
const os = require('os');
const path = require('path');
const bcrypt = require('bcryptjs');
const { spawn, spawnSync } = require('child_process');
const { DatabaseSync } = require('node:sqlite');
const { createTestContext } = require('./test-env');
const { getSmsConfig, sendOtpSms } = require('../sms-provider');

let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : fail++; console.log((cond ? '✅ ' : '❌ ') + name); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function req(base, route, { method = 'GET', token, body, form, rawText, raw, headers } = {}) {
  const opt = { method, headers: { ...(form || raw || rawText ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(headers || {}) } };
  if (form) opt.body = form; else if (body !== undefined) opt.body = JSON.stringify(body);
  const r = await fetch(base + route, opt);
  if (rawText) return { status: r.status, text: await r.text() };
  if (raw) return { status: r.status, buf: Buffer.from(await r.arrayBuffer()) };
  return { status: r.status, data: await r.json().catch(() => ({})) };
}
async function waitHealth(base) {
  for (let i = 0; i < 50; i++) {
    try { const r = await req(base, '/api/health'); if (r.data.ok) return true; } catch {}
    await sleep(150);
  }
  return false;
}
function startServer(env, port) {
  return spawn('node', ['server.js'], { cwd: __dirname + '/..', env: { ...env, PORT: String(port) }, stdio: 'pipe' });
}
async function expectReject(promise) { try { await promise; return false; } catch { return true; } }
const fakeFetch = payload => async () => ({ ok: true, status: 200, text: async () => JSON.stringify(payload) });

(async () => {
  const ctx = createTestContext('dream-classes-auth-');
  const BASE = 'http://127.0.0.1:3103';
  const srv = startServer({ ...ctx.env, OTP_RESEND_COOLDOWN_SECONDS: '60' }, 3103);
  let setupRoot = null, setupSrv = null, prodSrv = null;

  try {
    ok('Test server starts', await waitHealth(BASE));

    // ---------- OTP lifecycle ----------
    const mobile = '9812345678';
    const first = await req(BASE, '/api/auth/request-otp', { method: 'POST', body: { mobile: '+91 ' + mobile } });
    ok('+91 mobile is normalized and OTP issued locally for tests', first.status === 200 && /^\d{6}$/.test(first.data.devOtp || ''));
    ok('OTP response gives expiry + resend metadata', first.data.expiresInMinutes === 10 && first.data.resendAfterSeconds === 60);

    const cooldown = await req(BASE, '/api/auth/request-otp', { method: 'POST', body: { mobile } });
    ok('Immediate resend blocked by per-mobile cooldown', cooldown.status === 429 && cooldown.data.code === 'OTP_COOLDOWN' && cooldown.data.retryAfterSeconds > 0);

    const needName = await req(BASE, '/api/auth/verify-otp', { method: 'POST', body: { mobile, code: first.data.devOtp, device_id: 'auth-test' } });
    ok('New student without name gets a clear registration response', needName.status === 422 && needName.data.code === 'NEW_USER_NAME_REQUIRED');

    const registered = await req(BASE, '/api/auth/verify-otp', { method: 'POST', body: { mobile, code: first.data.devOtp, name: 'Auth Regression Student', device_id: 'auth-test' } });
    ok('Same OTP still works after name is supplied (old OTP-expired bug fixed)', registered.status === 200 && !!registered.data.token);
    const studentToken = registered.data.token;
    const studentId = registered.data.user.id;

    const reused = await req(BASE, '/api/auth/verify-otp', { method: 'POST', body: { mobile, code: first.data.devOtp, name: 'Reuse Attempt' } });
    ok('OTP is one-time only after successful registration', reused.status === 400 && reused.data.code === 'OTP_EXPIRED');

    const wrongMobile = '9812345679';
    const wrongReq = await req(BASE, '/api/auth/request-otp', { method: 'POST', body: { mobile: wrongMobile } });
    let lastWrong = null;
    for (let i = 0; i < 5; i++) lastWrong = await req(BASE, '/api/auth/verify-otp', { method: 'POST', body: { mobile: wrongMobile, code: '000000', name: 'Wrong Attempts' } });
    ok('Fifth wrong OTP locks the challenge', lastWrong.status === 400 && lastWrong.data.attemptsRemaining === 0);
    const afterLock = await req(BASE, '/api/auth/verify-otp', { method: 'POST', body: { mobile: wrongMobile, code: wrongReq.data.devOtp, name: 'Wrong Attempts' } });
    ok('Correct OTP no longer works after max wrong attempts', afterLock.status === 400);

    const expMobile = '9812345680';
    const expReq = await req(BASE, '/api/auth/request-otp', { method: 'POST', body: { mobile: expMobile } });
    const db1 = new DatabaseSync(ctx.dbPath); db1.exec('PRAGMA busy_timeout=5000');
    db1.prepare('UPDATE otps SET expires_at=? WHERE mobile=?').run(Date.now() - 1000, expMobile); db1.close();
    const expired = await req(BASE, '/api/auth/verify-otp', { method: 'POST', body: { mobile: expMobile, code: expReq.data.devOtp, name: 'Expired Student' } });
    ok('Expired OTP is rejected with OTP_EXPIRED', expired.status === 400 && expired.data.code === 'OTP_EXPIRED');
    ok('Invalid Indian mobile rejected', (await req(BASE, '/api/auth/request-otp', { method: 'POST', body: { mobile: '12345' } })).status === 400);
    ok('Malformed OTP rejected without consuming a challenge', (await req(BASE, '/api/auth/verify-otp', { method: 'POST', body: { mobile, code: 'abc' } })).data.code === 'OTP_INVALID_FORMAT');

    // ---------- Frontend must never render a demo OTP ----------
    const home = await req(BASE, '/', { rawText: true });
    ok('Student UI contains no Test Mode/dev OTP rendering', !home.text.includes('Test Mode OTP') && !home.text.includes('devOtp'));
    const adminPage = await req(BASE, '/admin', { rawText: true });
    ok('Teacher Panel is one valid HTML document with addTeacher restored', (adminPage.text.match(/<\/html>/g) || []).length === 1 && adminPage.text.includes('async function addTeacher()'));
    ok('Teacher Panel loads shared API config for in-app use', adminPage.text.includes('/js/app-config.js') && adminPage.text.includes("localStorage.getItem('dc_api_base')"));

    // ---------- Teacher auth / panel ----------
    const adminLogin = await req(BASE, '/api/auth/admin-login', { method: 'POST', body: { email: '  ADMIN@DREAMCLASSES.IN ', password: ctx.adminPassword } });
    ok('Teacher login accepts case/space-normalized email', adminLogin.status === 200 && !!adminLogin.data.token);
    const AT = adminLogin.data.token;
    ok('Wrong teacher password still returns generic 401', (await req(BASE, '/api/auth/admin-login', { method: 'POST', body: { email: 'admin@dreamclasses.in', password: 'wrong-password' } })).status === 401);
    const setupStatus = await req(BASE, '/api/setup/status');
    ok('Setup is closed once a Super Admin exists', setupStatus.data.setupRequired === false);
    ok('Setup endpoint cannot create a second Super Admin', (await req(BASE, '/api/setup/admin', { method: 'POST', body: { name: 'Nope', email: 'nope@example.com', password: 'A-Strong-Password-123', setup_token: 'x'.repeat(32) } })).status === 409);

    const config = await req(BASE, '/api/admin/config-status', { token: AT });
    ok('Config status confirms custom persistent-ready storage paths', config.data.storage?.customDataDirectoryConfigured === true && fs.existsSync(ctx.dbPath));

    const batch = (await req(BASE, '/api/admin/batches', { method: 'POST', token: AT, body: { name: 'Auth Batch', active: 1 } })).data.item;
    await req(BASE, '/api/admin/students/' + studentId, { method: 'PUT', token: AT, body: { status: 'APPROVED', batch_id: batch.id } });
    await req(BASE, '/api/admin/students/' + studentId, { method: 'PUT', token: AT, body: { batch_id: null } });
    const students = await req(BASE, '/api/admin/students?search=' + mobile, { token: AT });
    ok('Teacher can explicitly unassign a student batch', students.data.students[0]?.batch_id === null && students.data.students[0]?.status === 'APPROVED');

    const badPhoto = new FormData();
    badPhoto.append('photo', new Blob(['not really a png'], { type: 'image/png' }), 'fake.png');
    const badUpload = await req(BASE, '/api/auth/photo', { method: 'POST', token: studentToken, form: badPhoto });
    ok('Fake image upload rejected by content signature check', badUpload.status === 400 && String(badUpload.data.error).includes('does not match'));

    const fileTokenRes = await req(BASE, '/api/auth/file-token', { token: AT });
    const FT = fileTokenRes.data.fileToken;
    ok('Short-lived file token issued to a full session', typeof FT === 'string' && FT.length > 30);
    ok('File token cannot call account APIs', (await req(BASE, '/api/auth/me?ft=' + encodeURIComponent(FT))).status === 403);
    ok('Full session JWT in ?token= is no longer accepted', (await req(BASE, '/api/auth/me?token=' + encodeURIComponent(AT))).status === 401);
    const backup = await req(BASE, '/api/admin/backup.db?ft=' + encodeURIComponent(FT), { raw: true });
    ok('File token can download the protected teacher backup', backup.status === 200 && backup.buf.slice(0, 15).toString() === 'SQLite format 3');

    const tempEmail = 'logout-teacher@example.com';
    await req(BASE, '/api/admin/teachers', { method: 'POST', token: AT, body: { name: 'Logout Teacher', email: tempEmail, password: 'TeacherPassword@123' } });
    const tempLogin = await req(BASE, '/api/auth/admin-login', { method: 'POST', body: { email: tempEmail, password: 'TeacherPassword@123' } });
    const TT = tempLogin.data.token;
    ok('Teacher logout endpoint succeeds', (await req(BASE, '/api/auth/logout', { method: 'POST', token: TT, body: {} })).data.ok === true);
    ok('Logged-out teacher token is revoked server-side', (await req(BASE, '/api/auth/me', { token: TT })).status === 401);

    // ---------- SMS provider module: mocked, zero credits ----------
    ok('SMS config is honestly unconfigured without credentials', getSmsConfig({}).configured === false);
    ok('MSG91 requires both auth key and template', getSmsConfig({ MSG91_AUTH_KEY: 'x' }).configured === false && getSmsConfig({ MSG91_AUTH_KEY: 'x', MSG91_TEMPLATE_ID: 'y' }).configured === true);
    const msgEnv = { SMS_PROVIDER: 'msg91', MSG91_AUTH_KEY: 'test-key', MSG91_TEMPLATE_ID: 'template-1' };
    const msgOk = await sendOtpSms({ mobile, code: '123456', env: msgEnv, fetchImpl: fakeFetch({ type: 'success', request_id: 'req-1' }) });
    ok('MSG91 type=success accepted', msgOk.provider === 'msg91' && msgOk.requestId === 'req-1');
    ok('MSG91 HTTP-style error body is not faked as success', await expectReject(sendOtpSms({ mobile, code: '123456', env: msgEnv, fetchImpl: fakeFetch({ type: 'error', message: 'bad template' }) })));
    const twoEnv = { SMS_PROVIDER: '2factor', TWOFACTOR_API_KEY: 'test-key' };
    const twoOk = await sendOtpSms({ mobile, code: '123456', env: twoEnv, fetchImpl: fakeFetch({ Status: 'Success', Details: 'session-1' }) });
    ok('2Factor Status=Success accepted', twoOk.provider === '2factor' && twoOk.requestId === 'session-1');
    ok('2Factor Status=Error rejected', await expectReject(sendOtpSms({ mobile, code: '123456', env: twoEnv, fetchImpl: fakeFetch({ Status: 'Error', Details: 'no balance' }) })));
  } catch (e) { console.error('Crash:', e); fail++; }
  srv.kill(); await sleep(400);

  // ---------- Seed: no sample resurrection + explicit reset only ----------
  try {
    const db2 = new DatabaseSync(ctx.dbPath); db2.exec('PRAGMA busy_timeout=5000');
    db2.prepare('DELETE FROM classes').run();
    const before = db2.prepare("SELECT password_hash FROM users WHERE email='admin@dreamclasses.in'").get().password_hash;
    db2.close();

    let run = spawnSync('node', ['seed.js'], { cwd: __dirname + '/..', env: { ...ctx.env, ADMIN_PASSWORD: 'ChangedWithoutReset@123' }, encoding: 'utf8' });
    const db3 = new DatabaseSync(ctx.dbPath);
    ok('Seed does not recreate classes after teacher deletes them', run.status === 0 && db3.prepare('SELECT COUNT(*) n FROM classes').get().n === 0);
    ok('Changing ADMIN_PASSWORD alone does not silently reset teacher password', bcrypt.compareSync(ctx.adminPassword, db3.prepare("SELECT password_hash FROM users WHERE email='admin@dreamclasses.in'").get().password_hash));
    db3.close();

    run = spawnSync('node', ['seed.js'], { cwd: __dirname + '/..', env: { ...ctx.env, ADMIN_PASSWORD: 'ResetPassword@12345', ADMIN_PASSWORD_RESET: '1' }, encoding: 'utf8' });
    const db4 = new DatabaseSync(ctx.dbPath);
    const after = db4.prepare("SELECT password_hash FROM users WHERE email='admin@dreamclasses.in'").get().password_hash;
    db4.close();
    ok('Explicit ADMIN_PASSWORD_RESET=1 repairs teacher password', run.status === 0 && bcrypt.compareSync('ResetPassword@12345', after) && !bcrypt.compareSync(ctx.adminPassword, after));
    ok('Reset changed the stored hash', before !== after);
  } catch (e) { console.error('Seed test crash:', e); fail++; }

  // ---------- First-time setup in a database with no Super Admin ----------
  try {
    setupRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dream-classes-setup-'));
    const setupEnv = {
      ...ctx.env,
      DATA_DIR: path.join(setupRoot, 'data'),
      UPLOADS_DIR: path.join(setupRoot, 'uploads'),
      ADMIN_EMAIL: 'admin@dreamclasses.in',
      ADMIN_PASSWORD: '',
      ADMIN_SETUP_TOKEN: 'setup-token-for-tests-1234567890'
    };
    const seedRun = spawnSync('node', ['seed.js'], { cwd: __dirname + '/..', env: setupEnv, encoding: 'utf8' });
    ok('Seed with no ADMIN_PASSWORD creates no default teacher', seedRun.status === 0);
    setupSrv = startServer(setupEnv, 3104);
    const SB = 'http://127.0.0.1:3104';
    ok('Setup test server starts', await waitHealth(SB));
    const st = await req(SB, '/api/setup/status');
    ok('Setup status reports first-time setup + token configured', st.data.setupRequired === true && st.data.setupTokenConfigured === true);
    ok('Wrong setup token rejected', (await req(SB, '/api/setup/admin', { method: 'POST', body: { name: 'Dream Sir', email: 'admin@dreamclasses.in', password: 'SetupPassword@123', setup_token: 'wrong-token-wrong-token-wrong' } })).status === 401);
    const created = await req(SB, '/api/setup/admin', { method: 'POST', headers: { 'x-setup-token': setupEnv.ADMIN_SETUP_TOKEN }, body: { name: 'Dream Sir', email: 'ADMIN@DREAMCLASSES.IN', password: 'SetupPassword@123' } });
    ok('Correct setup token creates first Super Admin', created.status === 201 && created.data.user?.role === 'SUPER_ADMIN');
    ok('New setup account can login normally', !!(await req(SB, '/api/auth/admin-login', { method: 'POST', body: { email: 'admin@dreamclasses.in', password: 'SetupPassword@123' } })).data.token);
  } catch (e) { console.error('Setup test crash:', e); fail++; }
  if (setupSrv) setupSrv.kill(); await sleep(300);

  // ---------- Production fail-closed: no provider, no demo OTP ----------
  try {
    const prodEnv = {
      ...ctx.env,
      NODE_ENV: 'production',
      OTP_MODE: 'production',
      ALLOW_DEV_OTP: '1', // deliberately set: production must ignore it
      SMS_PROVIDER: '',
      MSG91_AUTH_KEY: '',
      MSG91_TEMPLATE_ID: '',
      TWOFACTOR_API_KEY: ''
    };
    prodSrv = startServer(prodEnv, 3105);
    const PB = 'http://127.0.0.1:3105';
    ok('Production-mode server starts for fail-closed check', await waitHealth(PB));
    const prodOtp = await req(PB, '/api/auth/request-otp', { method: 'POST', body: { mobile: '9812345999' } });
    ok('Production without SMS credentials returns honest 503', prodOtp.status === 503 && prodOtp.data.code === 'OTP_NOT_CONFIGURED');
    ok('Production response never contains a demo OTP', prodOtp.data.devOtp === undefined);
  } catch (e) { console.error('Production test crash:', e); fail++; }
  if (prodSrv) prodSrv.kill(); await sleep(300);

  ctx.cleanup();
  if (setupRoot) fs.rmSync(setupRoot, { recursive: true, force: true });
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
