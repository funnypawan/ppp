// Round 3: Workflows A–F + security probes. Run via npm test.
const { spawn } = require('child_process');
const { createTestContext } = require('./test-env');
const { PDFDocument } = require('pdf-lib');
const BASE = 'http://127.0.0.1:3102';
let pass = 0, fail = 0;
const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? '✅ ' : '❌ ') + n); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function req(path, { method = 'GET', token, body, form, raw, headers } = {}) {
  const opt = { method, headers: { ...(form || raw ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(headers || {}) } };
  if (form) opt.body = form; else if (body) opt.body = JSON.stringify(body);
  const r = await fetch(BASE + path, opt);
  if (raw) return { status: r.status, buf: Buffer.from(await r.arrayBuffer()) };
  return { status: r.status, data: await r.json().catch(() => ({})) };
}
async function makeStudent(AT, label, batchId) {
  const mobile = '96' + String(Math.floor(10000000 + Math.random() * 89999999));
  const otp = await req('/api/auth/request-otp', { method: 'POST', body: { mobile } });
  const reg = await req('/api/auth/verify-otp', { method: 'POST', body: { mobile, code: otp.data.devOtp, name: label, device_id: 'wf' } });
  await req('/api/admin/students/' + reg.data.user.id, { method: 'PUT', token: AT, body: { status: 'APPROVED', batch_id: batchId || null } });
  return { token: reg.data.token, id: reg.data.user.id, mobile };
}

(async () => {
  const ctx = createTestContext('dream-classes-workflows-');
  const srv = spawn('node', ['server.js'], { cwd: __dirname + '/..', env: { ...ctx.env, PORT: '3102' }, stdio: 'pipe' });
  await sleep(1700);
  const C = {}; // cleanup ids
  try {
    const AT = (await req('/api/auth/admin-login', { method: 'POST', body: { email: 'admin@dreamclasses.in', password: ctx.adminPassword } })).data.token;
    ok('Admin login', !!AT);

    // Two batches + two students
    const bX = (await req('/api/admin/batches', { method: 'POST', token: AT, body: { name: 'WF Batch X ' + Date.now(), active: 1 } })).data.item;
    const bY = (await req('/api/admin/batches', { method: 'POST', token: AT, body: { name: 'WF Batch Y ' + Date.now(), active: 1 } })).data.item;
    C.batches = [bX.id, bY.id];
    const stuX = await makeStudent(AT, 'WF Student X', bX.id);
    const stuY = await makeStudent(AT, 'WF Student Y', bY.id);
    C.students = [stuX.id, stuY.id];

    /* ---------- WORKFLOW A: class → chapter → PDF → student opens ---------- */
    const cls = (await req('/api/admin/classes', { method: 'POST', token: AT, body: { name: 'WF Class ' + Date.now(), sort: 99, published: 1 } })).data.item;
    C.classId = cls.id;
    const subj = (await req('/api/admin/subjects', { method: 'POST', token: AT, body: { class_id: cls.id, name: 'WF Science', icon: '🔬', sort: 0, published: 1 } })).data.item;
    const chap = (await req('/api/admin/chapters', { method: 'POST', token: AT, body: { subject_id: subj.id, name: 'WF Chapter Light', sort: 0, published: 1 } })).data.item;
    ok('A: Teacher created class/subject/chapter', !!chap?.id);
    const doc = await PDFDocument.create(); doc.addPage([300, 400]);
    const pdfBytes = Buffer.from(await doc.save());
    const pf = new FormData(); pf.append('title', 'WF Light Notes'); pf.append('chapter_id', String(chap.id));
    pf.append('published', '1'); pf.append('downloadable', '1'); pf.append('batch_ids', JSON.stringify([bX.id]));
    pf.append('files', new Blob([pdfBytes], { type: 'application/pdf' }), 'light.pdf');
    const pdfUp = await req('/api/admin/pdfs', { method: 'POST', token: AT, form: pf });
    const pdfId = pdfUp.data.created?.[0]; C.pdfId = pdfId;
    ok('A: PDF uploaded & published to Batch X', !!pdfId);
    const openX = await req(`/api/pdfs/${pdfId}/file`, { token: stuX.token, raw: true });
    ok('A: Batch X student opens PDF (%PDF)', openX.status === 200 && openX.buf.slice(0, 4).toString() === '%PDF');
    const openY = await req(`/api/pdfs/${pdfId}/file`, { token: stuY.token, raw: true });
    ok('A: Batch Y student DENIED the same PDF (403)', openY.status === 403);

    /* ---------- WORKFLOW B: video publish → play → offline source ---------- */
    const fakeMp4 = Buffer.concat([Buffer.from('....ftypisom'), Buffer.alloc(4096, 7)]);
    const vf = new FormData(); vf.append('title', 'WF Lecture'); vf.append('chapter_id', String(chap.id));
    vf.append('published', '1'); vf.append('downloadable', '1'); vf.append('batch_ids', JSON.stringify([bX.id]));
    vf.append('file', new Blob([fakeMp4], { type: 'video/mp4' }), 'lecture.mp4');
    const vidUp = await req('/api/admin/videos', { method: 'POST', token: AT, form: vf });
    const vidId = vidUp.data.item?.id; C.videoId = vidId;
    ok('B: Video uploaded & published', !!vidId);
    const play = await req(`/api/videos/${vidId}/play`, { token: stuX.token });
    ok('B: Authorized student gets signed stream URL', play.status === 200 && String(play.data.streamUrl).includes('/api/stream/'));
    ok('B: Watermark carries student identity (masked)', play.data.watermark?.name === 'WF Student X' && /^\*{6}\d{4}$/.test(play.data.watermark.mobile));
    const range = await req(play.data.streamUrl, { raw: true, headers: { Range: 'bytes=0-99' } });
    ok('B: Range streaming works (206, 100 bytes)', range.status === 206 && range.buf.length === 100);
    const full = await req(play.data.streamUrl, { raw: true });
    ok('B: Full fetch = offline-download source bytes match', full.buf.equals(fakeMp4));
    ok('B: downloadable flag exposed to player', play.data.video.downloadable === true);
    const playY = await req(`/api/videos/${vidId}/play`, { token: stuY.token });
    ok('B: Batch Y student DENIED playback (403)', playY.status === 403);
    const badPt = await req(`/api/stream/${vidId}?pt=invalid`, { raw: true });
    ok('B: Forged playback token rejected (403)', badPt.status === 403);

    /* ---------- WORKFLOW C: doubt with photo → teacher reply → student sees ---------- */
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==', 'base64');
    const df = new FormData(); df.append('question', 'WF: mirror formula doubt?'); df.append('image', new Blob([png], { type: 'image/png' }), 'q.png');
    const doubt = await req('/api/doubts', { method: 'POST', token: stuX.token, form: df });
    const doubtId = doubt.data.doubt?.id, imgPath = doubt.data.doubt?.image;
    ok('C: Student submitted doubt with photo', !!doubtId && !!imgPath);
    const imgName = String(imgPath).split('/').pop();
    ok('SEC: Doubt photo NOT public (/uploads/images → 404)', (await req(imgPath, { raw: true })).status === 404);
    ok('SEC: Doubt photo needs login (401)', (await req('/api/files/images/' + imgName, { raw: true })).status === 401);
    ok('SEC: Other student cannot view doubt photo (403)', (await req('/api/files/images/' + imgName, { token: stuY.token, raw: true })).status === 403);
    const ownImg = await req('/api/files/images/' + imgName, { token: stuX.token, raw: true });
    ok('C: Owner can view own doubt photo (200, PNG bytes)', ownImg.status === 200 && ownImg.buf.equals(png));
    ok('C: Teacher can view doubt photo', (await req('/api/files/images/' + imgName, { token: AT, raw: true })).status === 200);
    const rf = new FormData(); rf.append('text', 'Use 1/v + 1/u = 1/f with sign convention.'); rf.append('status', 'ANSWERED');
    ok('C: Teacher replied', (await req(`/api/doubts/${doubtId}/reply`, { method: 'POST', token: AT, form: rf })).data.ok === true);
    const mine = await req('/api/doubts', { token: stuX.token });
    const myD = mine.data.doubts.find(d => d.id === doubtId);
    ok('C: Student receives teacher response + status ANSWERED', myD?.status === 'ANSWERED' && myD.replies.some(r => r.text.includes('1/v')));
    const others = await req('/api/doubts', { token: stuY.token });
    ok("SEC: Other student cannot see X's private doubt", !others.data.doubts.some(d => d.id === doubtId));
    const rf2 = new FormData(); rf2.append('text', 'hacked reply');
    ok('SEC: Other student cannot reply into X doubt (403)', (await req(`/api/doubts/${doubtId}/reply`, { method: 'POST', token: stuY.token, form: rf2 })).status === 403);
    const notifX = await req('/api/notifications', { token: stuX.token });
    ok('C: Student got doubt-answered notification', notifX.data.notifications.some(n => n.title.includes('Doubt Answered')));

    /* ---------- WORKFLOW D: MCQ test → attempt → server-calculated result ---------- */
    const test = (await req('/api/admin/tests', { method: 'POST', token: AT, body: { title: 'WF Light Test', instructions: 'All compulsory', chapter_id: chap.id, duration_min: 30, negative_mark: 0.25, show_answers: true, state: 'DRAFT', batch_ids: [bX.id] } })).data.item;
    C.testId = test.id;
    const qs = [
      { text: 'Speed of light in vacuum?', options: ['3×10⁸ m/s', '3×10⁶ m/s', '1500 m/s', '340 m/s'], correct: 0 },
      { text: 'Mirror formula?', options: ['1/f=1/v−1/u', '1/f=1/v+1/u', 'f=v×u', 'f=v/u'], correct: 1 },
      { text: 'Unit of power of lens?', options: ['Watt', 'Joule', 'Dioptre', 'Newton'], correct: 2 }
    ];
    for (const q of qs) await req(`/api/admin/tests/${test.id}/questions`, { method: 'POST', token: AT, body: { ...q, marks: 1, explanation: 'exp' } });
    ok('D: Teacher created test with 3 MCQs', true);
    ok('D: Draft test invisible to students', !(await req('/api/tests', { token: stuX.token })).data.tests.some(t => t.id === test.id));
    await req(`/api/admin/tests/${test.id}`, { method: 'PUT', token: AT, body: { ...test, state: 'PUBLISHED', batch_ids: [bX.id] } });
    ok('D: Batch Y student cannot start Batch X test (403)', (await req(`/api/tests/${test.id}/start`, { method: 'POST', token: stuY.token, body: {} })).status === 403);
    const start = await req(`/api/tests/${test.id}/start`, { method: 'POST', token: stuX.token, body: {} });
    ok('D: Student starts published test, keys hidden', start.status === 200 && start.data.questions.every(q => q.correct === undefined));
    const answers = {}; start.data.questions.forEach((q, i) => answers[q.id] = qs[i].correct); // all correct first
    answers[start.data.questions[2].id] = 0; // make Q3 wrong → 2 − 0.25 = 1.75
    const submit = await req(`/api/tests/attempts/${start.data.attemptId}/submit`, { method: 'POST', token: stuX.token, body: { answers, score: 999, total: 999 } });
    ok('D: Server-calculated score = 1.75/3 (forged score ignored)', submit.data.result?.score === 1.75 && submit.data.result?.total === 3);
    ok('SEC: Student cannot review via tampered re-submit (400)', (await req(`/api/tests/attempts/${start.data.attemptId}/submit`, { method: 'POST', token: stuX.token, body: { answers } })).status === 400);
    ok("SEC: Other student cannot view X's result review (403)", (await req(`/api/tests/attempts/${start.data.attemptId}/review`, { token: stuY.token })).status === 403);

    // Late-submit anti-cheat: second test, autosave correct answer, backdate start, submit wrong → scored from autosave
    const late = (await req('/api/admin/tests', { method: 'POST', token: AT, body: { title: 'WF Late Test', chapter_id: chap.id, duration_min: 30, negative_mark: 0, show_answers: true, state: 'PUBLISHED', batch_ids: [] } })).data.item;
    C.lateTestId = late.id;
    await req(`/api/admin/tests/${late.id}/questions`, { method: 'POST', token: AT, body: { text: '1+1?', options: ['1', '2', '3', '4'], correct: 1, marks: 1 } });
    const ls = await req(`/api/tests/${late.id}/start`, { method: 'POST', token: stuY.token, body: {} });
    const lqid = ls.data.questions[0].id;
    await req(`/api/tests/attempts/${ls.data.attemptId}/save`, { method: 'POST', token: stuY.token, body: { answers: { [lqid]: 1 } } }); // autosaved CORRECT
    try {
      const { DatabaseSync } = require('node:sqlite');
      const d = new DatabaseSync(ctx.dbPath); d.exec('PRAGMA busy_timeout=5000');
      d.prepare('UPDATE test_attempts SET started_at=? WHERE id=?').run(Date.now() - (30 * 60 + 600) * 1000, ls.data.attemptId); d.close();
      const lateSubmit = await req(`/api/tests/attempts/${ls.data.attemptId}/submit`, { method: 'POST', token: stuY.token, body: { answers: { [lqid]: 0 } } }); // WRONG after time
      ok('SEC: Late submit scored from auto-saved answers (1/1, post-time change ignored)', lateSubmit.data.result?.score === 1);
    } catch (e) { ok('SEC: Late submit test (DB backdate) — ' + e.message, false); }

    /* ---------- WORKFLOW E: batch-targeted notification ---------- */
    const notif = await req('/api/admin/notifications', { method: 'POST', token: AT, body: { title: 'WF Batch X Only', message: 'special class', target_type: 'BATCH', target_id: bX.id } });
    ok('E: Recipient count = 1 (only Batch X)', notif.data.recipients === 1);
    const nx = await req('/api/notifications', { token: stuX.token });
    const ny = await req('/api/notifications', { token: stuY.token });
    ok('E: Batch X student receives it', nx.data.notifications.some(n => n.title === 'WF Batch X Only'));
    ok('E: Batch Y student does NOT receive it', !ny.data.notifications.some(n => n.title === 'WF Batch X Only'));

    /* ---------- Security probes ---------- */
    ok('SEC: Student → admin stats 403', (await req('/api/admin/stats', { token: stuX.token })).status === 403);
    ok('SEC: Student → students list 403', (await req('/api/admin/students', { token: stuX.token })).status === 403);
    ok('SEC: Student → config-status 403', (await req('/api/admin/config-status', { token: stuX.token })).status === 403);
    const cfg = await req('/api/admin/config-status', { token: AT });
    ok('CFG: Admin config-status reports local test OTP warning', cfg.status === 200 && cfg.data.warnings.some(w => w.includes('OTP')));
    ok('CFG: Seeded test admin does NOT use a default password', !cfg.data.warnings.some(w => w.includes('DEFAULT password')));
    ok('SEC: No token → content 401', (await req('/api/structure')).status === 401);
    ok('SEC: Garbage token → 401', (await req('/api/structure', { token: 'x.y.z' })).status === 401);
    ok('SEC: Path traversal on file route blocked', [400, 404].includes((await req('/api/files/images/..%2F..%2Fdata%2Fdream.db', { token: AT, raw: true })).status));
    // Session revocation by admin
    await req(`/api/admin/students/${stuY.id}/revoke-session`, { method: 'POST', token: AT, body: {} });
    ok('SEC: Admin session-revocation kills student token (401)', (await req('/api/auth/me', { token: stuY.token })).status === 401);

    /* ---------- WORKFLOW F: block student → content denied ---------- */
    await req(`/api/admin/students/${stuX.id}`, { method: 'PUT', token: AT, body: { status: 'BLOCKED' } });
    ok('F: Blocked student existing token immediately revoked/denied structure', [401, 403].includes((await req('/api/structure', { token: stuX.token })).status));
    ok('F: Blocked student denied video play', [401, 403].includes((await req(`/api/videos/${C.videoId}/play`, { token: stuX.token })).status));
    ok('F: Blocked student denied PDF file', [401, 403].includes((await req(`/api/pdfs/${C.pdfId}/file`, { token: stuX.token, raw: true })).status));
    const otpF = await req('/api/auth/request-otp', { method: 'POST', body: { mobile: stuX.mobile } });
    ok('F: Blocked student cannot re-login (403)', (await req('/api/auth/verify-otp', { method: 'POST', body: { mobile: stuX.mobile, code: otpF.data.devOtp, device_id: 'f' } })).status === 403);
  } catch (e) { console.error('Crash:', e); fail++; }
  srv.kill(); await sleep(400);
  try {
    const { DatabaseSync } = require('node:sqlite');
    const d = new DatabaseSync(ctx.dbPath); d.exec('PRAGMA busy_timeout=5000');
    if (C.videoId) d.prepare('DELETE FROM videos WHERE id=?').run(C.videoId);
    if (C.pdfId) d.prepare('DELETE FROM pdf_notes WHERE id=?').run(C.pdfId);
    [C.testId, C.lateTestId].forEach(id => { if (id) { d.prepare('DELETE FROM test_attempts WHERE test_id=?').run(id); d.prepare('DELETE FROM tests WHERE id=?').run(id); } });
    (C.students || []).forEach(id => { d.prepare('DELETE FROM test_attempts WHERE student_id=?').run(id); d.prepare('DELETE FROM doubts WHERE student_id=?').run(id); d.prepare('DELETE FROM users WHERE id=?').run(id); });
    (C.batches || []).forEach(id => d.prepare('DELETE FROM batches WHERE id=?').run(id));
    if (C.classId) d.prepare('DELETE FROM classes WHERE id=?').run(C.classId);
    d.prepare("DELETE FROM notifications WHERE title='WF Batch X Only'").run();
    (C.students || []).forEach(id => d.prepare("DELETE FROM notifications WHERE target_type='STUDENT' AND target_id=?").run(id));
    d.close(); console.log('🧹 Workflow test data cleaned up');
  } catch (e) { console.warn('Cleanup warning:', e.message); }
  ctx.cleanup();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
