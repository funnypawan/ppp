// End-to-end smoke tests against a live server on PORT 3100. Run: npm test
const { spawn } = require('child_process');
const BASE = 'http://127.0.0.1:3100';
let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : fail++; console.log((cond ? '✅ ' : '❌ ') + name); };
async function req(path, { method = 'GET', token, body } = {}) {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json().catch(() => ({})) };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const srv = spawn('node', ['server.js'], { cwd: __dirname + '/..', env: { ...process.env, PORT: '3100' }, stdio: 'pipe' });
  await sleep(1600);
  try {
    ok('Health check', (await req('/api/health')).data.ok === true);
    ok('Unauthorized blocked', (await req('/api/structure')).status === 401);

    // Admin login (seed must have run)
    const adm = await req('/api/auth/admin-login', { method: 'POST', body: { email: 'admin@dreamclasses.in', password: process.env.ADMIN_PASSWORD || 'Dream@12345' } });
    ok('Admin login', !!adm.data.token); const AT = adm.data.token;
    ok('Wrong admin password rejected', (await req('/api/auth/admin-login', { method: 'POST', body: { email: 'admin@dreamclasses.in', password: 'wrong' } })).status === 401);

    // Student OTP flow
    const mobile = '98' + String(Math.floor(10000000 + Math.random() * 89999999));
    const otp = await req('/api/auth/request-otp', { method: 'POST', body: { mobile } });
    ok('OTP issued (dev mode)', !!otp.data.devOtp);
    ok('Wrong OTP rejected', (await req('/api/auth/verify-otp', { method: 'POST', body: { mobile, code: '000000' } })).status === 400);
    const reg = await req('/api/auth/verify-otp', { method: 'POST', body: { mobile, code: otp.data.devOtp, name: 'Test Student', device_id: 'test' } });
    ok('Student registers via OTP', !!reg.data.token); const ST = reg.data.token;
    ok('New student starts PENDING (manual approval)', reg.data.user.status === 'PENDING');
    ok('Pending student blocked from content', (await req('/api/structure', { token: ST })).status === 403);
    ok('Student cannot access admin APIs', (await req('/api/admin/stats', { token: ST })).status === 403);

    // Admin approves
    const list = await req('/api/admin/students?search=' + mobile, { token: AT });
    const sid = list.data.students[0]?.id;
    await req('/api/admin/students/' + sid, { method: 'PUT', token: AT, body: { status: 'APPROVED' } });
    ok('Approved student can load structure', (await req('/api/structure', { token: ST })).status === 200);

    // Test flow: server-side scoring, no answer leak, duplicate blocked
    const tests = await req('/api/tests', { token: ST });
    const pub = tests.data.tests.find(t => t.state === 'PUBLISHED');
    ok('Seeded published test visible', !!pub);
    const start = await req(`/api/tests/${pub.id}/start`, { method: 'POST', token: ST, body: {} });
    ok('Test starts, answer keys NOT leaked', start.data.questions?.every(q => q.correct === undefined));
    const answers = {}; start.data.questions.forEach(q => answers[q.id] = 0);
    const submit = await req(`/api/tests/attempts/${start.data.attemptId}/submit`, { method: 'POST', token: ST, body: { answers } });
    ok('Server calculates score', typeof submit.data.result?.score === 'number' && submit.data.result.total === 3);
    ok('Duplicate submission blocked', (await req(`/api/tests/attempts/${start.data.attemptId}/submit`, { method: 'POST', token: ST, body: { answers } })).status === 400);
    const review = await req(`/api/tests/attempts/${start.data.attemptId}/review`, { token: ST });
    ok('Review shows answers after submit (show_answers on)', review.data.questions[0].correct !== undefined);

    // Doubt flow + privacy
    const doubt = await req('/api/doubts', { token: ST }); // GET list ok
    ok('Doubts list loads', doubt.status === 200);
    const dash = await req('/api/dashboard', { token: ST });
    ok('Dashboard analytics from real data', dash.data.attempts === 1);

    // Single-device: old token dies after new login
    const otp2 = await req('/api/auth/request-otp', { method: 'POST', body: { mobile } });
    await req('/api/auth/verify-otp', { method: 'POST', body: { mobile, code: otp2.data.devOtp, device_id: 'device2' } });
    ok('Single-device: old session revoked', (await req('/api/auth/me', { token: ST })).status === 401);

    // Blocked student enforcement
    await req('/api/admin/students/' + sid, { method: 'PUT', token: AT, body: { status: 'BLOCKED' } });
    const otp3 = await req('/api/auth/request-otp', { method: 'POST', body: { mobile } });
    const blockedLogin = await req('/api/auth/verify-otp', { method: 'POST', body: { mobile, code: otp3.data.devOtp, device_id: 'd3' } });
    ok('Blocked student cannot login', blockedLogin.status === 403);
  } catch (e) { console.error('Test crash:', e); fail++; }
  srv.kill();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
