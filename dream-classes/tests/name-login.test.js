// Name-only student login + Teacher Panel regression tests:
// - student app asks for a full name only (no mobile/SMS/OTP fields)
// - legacy OTP endpoints are disabled in the default STUDENT_AUTH_MODE=name
// - first name entry creates a pending student; the same normalized name logs back in
// - teacher approval/batch flow still controls content access
// - /api/admin/batches works (regression: a bad ORDER BY used to leave the
//   Videos/PDF Notes pages stuck on a spinner)
// - uploaded Dream Classes logo assets are present and valid PNG files
const { spawn } = require('child_process');
const { createTestContext } = require('./test-env');

let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : fail++; console.log((cond ? '✅ ' : '❌ ') + name); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function req(base, route, { method = 'GET', token, body, rawText, raw } = {}) {
  const opt = { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) } };
  if (body !== undefined) opt.body = JSON.stringify(body);
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
const pngSize = buf => buf && buf.length > 24 && buf.slice(1, 4).toString() === 'PNG'
  ? [buf.readUInt32BE(16), buf.readUInt32BE(20)]
  : [0, 0];

(async () => {
  const ctx = createTestContext('dream-classes-name-', { STUDENT_AUTH_MODE: 'name' });
  const BASE = 'http://127.0.0.1:3106';
  const srv = spawn('node', ['server.js'], { cwd: __dirname + '/..', env: { ...ctx.env, PORT: '3106' }, stdio: 'pipe' });

  try {
    ok('Name-login test server starts', await waitHealth(BASE));

    const home = await req(BASE, '/', { rawText: true });
    ok('Student login shows only the full-name field', home.text.includes('id="studentName"') && home.text.includes('nameLogin()'));
    ok('Student login has no mobile/OTP flow left', !home.text.includes('id="mob"') && !home.text.includes('Enter 6-digit OTP') && !home.text.includes('/api/auth/request-otp') && !home.text.includes('Send OTP'));
    ok('Student app opens the Teacher Panel file that works inside the APK', home.text.includes('href="/admin.html"'));
    ok('Student app uses the uploaded Dream Classes logo', home.text.includes('/icons/logo.png'));

    const otpReq = await req(BASE, '/api/auth/request-otp', { method: 'POST', body: { mobile: '9812345678' } });
    ok('Legacy OTP request endpoint is disabled in name mode', otpReq.status === 410 && otpReq.data.code === 'OTP_LOGIN_DISABLED');
    const otpVerify = await req(BASE, '/api/auth/verify-otp', { method: 'POST', body: { mobile: '9812345678', code: '123456' } });
    ok('Legacy OTP verify endpoint is disabled in name mode', otpVerify.status === 410 && otpVerify.data.code === 'OTP_LOGIN_DISABLED');

    ok('Blank student name is rejected clearly', (await req(BASE, '/api/auth/name-login', { method: 'POST', body: { name: '  ', device_id: 'name-device-1' } })).status === 400);

    const created = await req(BASE, '/api/auth/name-login', { method: 'POST', body: { name: '  Naam   Test Student ', device_id: 'name-device-1' } });
    ok('First name entry creates the student account', created.status === 201 && created.data.created === true && !!created.data.token);
    ok('Name is normalized and no mobile is stored', created.data.user?.name === 'Naam Test Student' && created.data.user?.mobile === null);
    ok('New name-only student waits for teacher approval by default', created.data.user?.status === 'PENDING');
    const studentId = created.data.user.id;
    let studentToken = created.data.token;
    ok('Pending student cannot open protected content yet', (await req(BASE, '/api/dashboard', { token: studentToken })).status === 403);

    const sameDevice = await req(BASE, '/api/auth/name-login', { method: 'POST', body: { name: 'naam test student', device_id: 'name-device-1' } });
    ok('Same name on the same device logs into the same account', sameDevice.status === 200 && sameDevice.data.created === false && sameDevice.data.user?.id === studentId);
    studentToken = sameDevice.data.token;

    const otherDevice = await req(BASE, '/api/auth/name-login', { method: 'POST', body: { name: 'Naam Test Student', device_id: 'name-device-2' } });
    ok('Owner-requested pure name login also works from another device when the name is unique', otherDevice.status === 200 && otherDevice.data.user?.id === studentId);
    studentToken = otherDevice.data.token;

    const adminLogin = await req(BASE, '/api/auth/admin-login', { method: 'POST', body: { email: 'admin@dreamclasses.in', password: ctx.adminPassword } });
    ok('Teacher login still works', adminLogin.status === 200 && !!adminLogin.data.token);
    const AT = adminLogin.data.token;

    const config = await req(BASE, '/api/admin/config-status', { token: AT });
    ok('Config confirms name login and no SMS requirement', config.data.studentAuthMode === 'name' && config.data.otpLoginEnabled === false && config.data.smsRequired === false);

    const baseLists = await Promise.all(['/api/admin/classes', '/api/admin/subjects', '/api/admin/chapters', '/api/admin/batches', '/api/admin/videos', '/api/admin/pdfs']
      .map(route => req(BASE, route, { token: AT })));
    ok('Teacher Videos/PDF base lists all load (spinner regression fixed)', baseLists.every(r => r.status === 200 && Array.isArray(r.data.items)));

    const adminPage = await req(BASE, '/admin', { rawText: true });
    ok('Teacher Panel shows a retry/error state instead of an endless spinner', adminPage.text.includes('function viewError') && adminPage.text.includes('Promise.allSettled'));
    ok('Teacher Panel uses the uploaded logo', adminPage.text.includes('/icons/logo.png'));

    const found = await req(BASE, '/api/admin/students?search=' + encodeURIComponent('Naam Test'), { token: AT });
    ok('Teacher can find the name-only student by name', found.data.students?.some(s => s.id === studentId && s.mobile === null));

    const batch = (await req(BASE, '/api/admin/batches', { method: 'POST', token: AT, body: { name: 'Name Login Batch', active: 1 } })).data.item;
    const approved = await req(BASE, '/api/admin/students/' + studentId, { method: 'PUT', token: AT, body: { status: 'APPROVED', batch_id: batch.id } });
    ok('Teacher can approve and batch-assign the name-only student', approved.status === 200 && approved.data.user?.status === 'APPROVED' && approved.data.user?.batch_id === batch.id);
    ok('Approved name-only student can open the dashboard/content APIs', (await req(BASE, '/api/dashboard', { token: studentToken })).status === 200);

    await req(BASE, '/api/admin/students/' + studentId, { method: 'PUT', token: AT, body: { status: 'BLOCKED' } });
    ok('Blocked student cannot login by name', (await req(BASE, '/api/auth/name-login', { method: 'POST', body: { name: 'Naam Test Student', device_id: 'name-device-2' } })).status === 403);
    await req(BASE, '/api/admin/students/' + studentId, { method: 'PUT', token: AT, body: { status: 'APPROVED' } });
    ok('Unblocked student can login by name again', (await req(BASE, '/api/auth/name-login', { method: 'POST', body: { name: 'Naam Test Student', device_id: 'name-device-2' } })).status === 200);

    const logo = await req(BASE, '/icons/logo.png', { raw: true });
    ok('Uploaded logo is served as a 512×512 PNG', logo.status === 200 && pngSize(logo.buf).join('x') === '512x512');
    const icon = await req(BASE, '/icons/icon-512.png', { raw: true });
    ok('App icon is served as a 512×512 PNG', icon.status === 200 && pngSize(icon.buf).join('x') === '512x512');
    const manifest = await req(BASE, '/manifest.webmanifest', { rawText: true });
    ok('PWA manifest uses the generated 192px icon', manifest.text.includes('/icons/icon-192.png') && manifest.text.includes('"sizes": "192x192"'));
  } catch (e) {
    console.error('Crash:', e);
    fail++;
  } finally {
    srv.kill();
    await sleep(400);
    ctx.cleanup();
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
