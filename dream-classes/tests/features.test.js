// Feature tests (round 2): practice, Web Push, scheduled notifications, PDF watermark,
// video qualities/HLS config, password change, weekly analytics, doubt PDF solutions.
const { spawn } = require('child_process');
const { createTestContext } = require('./test-env');
const { PDFDocument } = require('pdf-lib');
const BASE = 'http://127.0.0.1:3101';
let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : fail++; console.log((cond ? '✅ ' : '❌ ') + name); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function req(path, { method = 'GET', token, body, form, raw } = {}) {
  const opt = { method, headers: { ...(form || raw ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: 'Bearer ' + token } : {}) } };
  if (form) opt.body = form; else if (body) opt.body = JSON.stringify(body);
  const r = await fetch(BASE + path, opt);
  if (raw) return { status: r.status, buf: Buffer.from(await r.arrayBuffer()) };
  return { status: r.status, data: await r.json().catch(() => ({})) };
}

(async () => {
  const ctx = createTestContext('dream-classes-features-');
  const srv = spawn('node', ['server.js'], { cwd: __dirname + '/..', env: { ...ctx.env, PORT: '3101' }, stdio: 'pipe' });
  await sleep(1600);
  const cleanup = { videoId: null, pdfIds: [], practiceIds: [], teacherEmail: null, studentId: null };
  try {
    const adm = await req('/api/auth/admin-login', { method: 'POST', body: { email: 'admin@dreamclasses.in', password: ctx.adminPassword } });
    const AT = adm.data.token; ok('Admin login', !!AT);

    // Student (auto via OTP, approve)
    const mobile = '97' + String(Math.floor(10000000 + Math.random() * 89999999));
    const otp = await req('/api/auth/request-otp', { method: 'POST', body: { mobile } });
    const reg = await req('/api/auth/verify-otp', { method: 'POST', body: { mobile, code: otp.data.devOtp, name: 'Feature Tester', device_id: 't' } });
    const ST = reg.data.token; cleanup.studentId = reg.data.user.id;
    await req('/api/admin/students/' + cleanup.studentId, { method: 'PUT', token: AT, body: { status: 'APPROVED' } });
    ok('Student approved', (await req('/api/structure', { token: ST })).status === 200);

    // Find seeded chapter with practice questions
    const struct = (await req('/api/structure', { token: ST })).data.classes;
    let chapId = null;
    for (const c of struct) for (const s of c.subjects) for (const ch of s.chapters) if (ch.name === 'Real Numbers') chapId = ch.id;
    ok('Found Real Numbers chapter', !!chapId);

    // PRACTICE
    const prac = await req(`/api/chapters/${chapId}/practice`, { token: ST });
    ok('Practice questions load', prac.data.questions.length >= 3);
    ok('Practice answers NOT leaked', prac.data.questions.every(q => q.correct === undefined));
    const q0 = prac.data.questions[0];
    const adminPrac = await req(`/api/admin/practice?chapter_id=${chapId}`, { token: AT });
    const correctIdx = adminPrac.data.items.find(q => q.id === q0.id).correct;
    const wrong = await req(`/api/practice/${q0.id}/check`, { method: 'POST', token: ST, body: { selected: (correctIdx + 1) % 4 } });
    ok('Wrong practice answer marked wrong', wrong.data.correct === false && wrong.data.correctIndex === correctIdx);
    const right = await req(`/api/practice/${q0.id}/check`, { method: 'POST', token: ST, body: { selected: correctIdx } });
    ok('Correct practice answer marked correct + explanation', right.data.correct === true && typeof right.data.explanation === 'string');
    const dash = await req('/api/dashboard', { token: ST });
    ok('Dashboard has upcomingTests + subjectPerformance + practice stats', Array.isArray(dash.data.upcomingTests) && Array.isArray(dash.data.subjectPerformance) && dash.data.practice.answered >= 1 && dash.data.practice.correct >= 1);
    const content = await req(`/api/chapters/${chapId}/content`, { token: ST });
    ok('Chapter content reports practiceCount', content.data.practiceCount >= 3);
    // Admin creates + deletes a practice question
    const newP = await req('/api/admin/practice', { method: 'POST', token: AT, body: { chapter_id: chapId, text: '2+2=?', options: ['3', '4', '5', '6'], correct: 1, explanation: 'Basic addition' } });
    ok('Admin can add practice question', !!newP.data.item?.id); cleanup.practiceIds.push(newP.data.item.id);

    // WEB PUSH
    const key = await req('/api/push/key');
    ok('VAPID public key served', typeof key.data.publicKey === 'string' && key.data.publicKey.length > 20);
    ok('Invalid push subscription rejected', (await req('/api/push/subscribe', { method: 'POST', token: ST, body: {} })).status === 400);
    const fakeSub = { endpoint: 'https://push.example.invalid/sub/' + Date.now(), keys: { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM', auth: 'tBHItJI5svayuus7KIQ' } };
    ok('Push subscription saved', (await req('/api/push/subscribe', { method: 'POST', token: ST, body: fakeSub })).data.ok === true);
    ok('Push unsubscribe works', (await req('/api/push/unsubscribe', { method: 'POST', token: ST, body: { endpoint: fakeSub.endpoint } })).data.ok === true);

    // SCHEDULED NOTIFICATION: future = hidden from student, SCHEDULED in admin history
    const future = new Date(Date.now() + 3600e3).toISOString().slice(0, 19).replace('T', ' ');
    const sch = await req('/api/admin/notifications', { method: 'POST', token: AT, body: { title: 'Future Notice XYZ', message: 'later', target_type: 'ALL', scheduled_at: future } });
    ok('Scheduled notification accepted', !!sch.data.id);
    const notifs = await req('/api/notifications', { token: ST });
    ok('Future notification hidden from student', !notifs.data.notifications.some(n => n.title === 'Future Notice XYZ'));
    const hist = await req('/api/admin/notifications', { token: AT });
    ok('Admin history shows SCHEDULED status', hist.data.items.some(n => n.title === 'Future Notice XYZ' && n.status === 'SCHEDULED'));
    const now = await req('/api/admin/notifications', { method: 'POST', token: AT, body: { title: 'Instant Notice XYZ', message: 'now', target_type: 'ALL' } });
    ok('Instant notification reports recipient count', typeof now.data.recipients === 'number');
    const notifs2 = await req('/api/notifications', { token: ST });
    ok('Instant notification visible to student', notifs2.data.notifications.some(n => n.title === 'Instant Notice XYZ'));

    // VIDEO QUALITIES
    const vf = new FormData();
    vf.append('title', 'Quality Test Lecture'); vf.append('chapter_id', String(chapId));
    vf.append('url', 'https://example.com/master.m3u8'); vf.append('source_type', 'url');
    vf.append('published', '1'); vf.append('batch_ids', '[]');
    vf.append('qualities', JSON.stringify([{ label: '240p', url: 'https://example.com/240.mp4' }, { label: '720p', url: 'https://example.com/720.mp4' }, { label: '', url: 'bad' }]));
    const vid = await req('/api/admin/videos', { method: 'POST', token: AT, form: vf });
    cleanup.videoId = vid.data.item?.id;
    ok('Video with qualities created', !!cleanup.videoId);
    const play = await req(`/api/videos/${cleanup.videoId}/play`, { token: ST });
    ok('Play returns only valid qualities (240p/720p)', play.data.video.qualities.length === 2 && play.data.video.qualities[0].label === '240p');

    // PDF WATERMARK: upload a real PDF, download → stamped (bigger, still valid)
    const doc = await PDFDocument.create(); doc.addPage([300, 400]);
    const orig = Buffer.from(await doc.save());
    const pf = new FormData();
    pf.append('title', 'Watermark Test Notes'); pf.append('chapter_id', String(chapId));
    pf.append('published', '1'); pf.append('downloadable', '1'); pf.append('batch_ids', '[]');
    pf.append('files', new Blob([orig], { type: 'application/pdf' }), 'notes.pdf');
    const pdfUp = await req('/api/admin/pdfs', { method: 'POST', token: AT, form: pf });
    cleanup.pdfIds = pdfUp.data.created || [];
    ok('PDF uploaded', cleanup.pdfIds.length === 1);
    const dl = await req(`/api/pdfs/${cleanup.pdfIds[0]}/file?download=1`, { token: ST, raw: true });
    ok('Watermarked download is a valid, larger PDF', dl.buf.slice(0, 4).toString() === '%PDF' && dl.buf.length > orig.length);
    const reloaded = await PDFDocument.load(dl.buf).catch(() => null);
    ok('Watermarked PDF re-opens in parser', !!reloaded && reloaded.getPageCount() === 1);
    const inline = await req(`/api/pdfs/${cleanup.pdfIds[0]}/file`, { token: ST, raw: true });
    ok('Inline read returns original bytes', inline.buf.length === orig.length);

    // DOUBT WITH PDF SOLUTION
    const df = new FormData(); df.append('question', 'Explain HCF by division method?');
    const doubt = await req('/api/doubts', { method: 'POST', token: ST, form: df });
    const doubtId = doubt.data.doubt?.id;
    const rf = new FormData(); rf.append('text', 'See attached solution'); rf.append('status', 'ANSWERED');
    rf.append('pdf', new Blob([orig], { type: 'application/pdf' }), 'solution.pdf');
    ok('Teacher reply with PDF accepted', (await req(`/api/doubts/${doubtId}/reply`, { method: 'POST', token: AT, form: rf })).data.ok === true);
    const myDoubts = await req('/api/doubts', { token: ST });
    const mine = myDoubts.data.doubts.find(d => d.id === doubtId);
    ok('Student sees PDF solution on doubt', !!mine?.replies?.some(r => r.pdf));

    // WEEKLY ANALYTICS
    const weekly = await req('/api/admin/weekly', { token: AT });
    ok('Weekly analytics returns 7 days', weekly.data.days?.length === 7 && typeof weekly.data.days[6].registrations === 'number');

    // PASSWORD CHANGE (via a throwaway teacher)
    cleanup.teacherEmail = 't' + Date.now() + '@dreamclasses.in';
    await req('/api/admin/teachers', { method: 'POST', token: AT, body: { name: 'Temp Teacher', email: cleanup.teacherEmail, password: 'OldPassword@123' } });
    const tLogin = await req('/api/auth/admin-login', { method: 'POST', body: { email: cleanup.teacherEmail, password: 'OldPassword@123' } });
    const TT = tLogin.data.token; ok('Teacher login works', !!TT);
    ok('Wrong current password rejected', (await req('/api/admin/change-password', { method: 'POST', token: TT, body: { current: 'nope', next: 'NewPassword@123' } })).status === 400);
    ok('Short password rejected', (await req('/api/admin/change-password', { method: 'POST', token: TT, body: { current: 'OldPassword@123', next: 'short' } })).status === 400);
    ok('Password change succeeds', (await req('/api/admin/change-password', { method: 'POST', token: TT, body: { current: 'OldPassword@123', next: 'NewPassword@123' } })).data.ok === true);
    ok('Old token revoked after password change', (await req('/api/auth/me', { token: TT })).status === 401);
    ok('New password logs in', !!(await req('/api/auth/admin-login', { method: 'POST', body: { email: cleanup.teacherEmail, password: 'NewPassword@123' } })).data.token);

    // BACKUP (super admin only)
    const bk = await req('/api/admin/backup.db', { token: AT, raw: true });
    ok('Super admin can download DB backup (SQLite header)', bk.buf.slice(0, 15).toString() === 'SQLite format 3');
    ok('Student cannot download backup', (await req('/api/admin/backup.db', { token: ST })).status === 403);
  } catch (e) { console.error('Crash:', e); fail++; }
  srv.kill();
  await sleep(400);
  // Clean up test artifacts directly in DB
  try {
    const { DatabaseSync } = require('node:sqlite');
    const d = new DatabaseSync(ctx.dbPath);
    if (cleanup.videoId) d.prepare('DELETE FROM videos WHERE id=?').run(cleanup.videoId);
    cleanup.pdfIds.forEach(id => d.prepare('DELETE FROM pdf_notes WHERE id=?').run(id));
    cleanup.practiceIds.forEach(id => d.prepare('DELETE FROM practice_questions WHERE id=?').run(id));
    if (cleanup.teacherEmail) d.prepare('DELETE FROM users WHERE email=?').run(cleanup.teacherEmail);
    if (cleanup.studentId) { d.prepare('DELETE FROM practice_answers WHERE student_id=?').run(cleanup.studentId); d.prepare('DELETE FROM doubts WHERE student_id=?').run(cleanup.studentId); d.prepare('DELETE FROM users WHERE id=?').run(cleanup.studentId); }
    d.prepare("DELETE FROM notifications WHERE title IN ('Future Notice XYZ','Instant Notice XYZ')").run();
    d.close(); console.log('🧹 Test data cleaned up');
  } catch (e) { console.warn('Cleanup warning:', e.message); }
  ctx.cleanup();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
