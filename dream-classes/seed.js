// Dream Classes — safe, idempotent bootstrap.
// - Creates the first Super Admin only from ADMIN_EMAIL + ADMIN_PASSWORD.
// - Never falls back to a public/default password.
// - Creates sample learning structure only once. A marker prevents deleted
//   sample content from reappearing after every restart.
const bcrypt = require('bcryptjs');
const { db, getSetting, setSetting } = require('./db');

const normalizeEmail = value => String(value || '').trim().toLowerCase();
const isValidEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isStrongPassword = value => typeof value === 'string' && value.length >= 12;

const ADMIN_EMAIL = normalizeEmail(process.env.ADMIN_EMAIL || 'admin@dreamclasses.in');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const RESET_REQUESTED = process.env.ADMIN_PASSWORD_RESET === '1';

function ensureSuperAdmin() {
  if (!isValidEmail(ADMIN_EMAIL)) {
    console.error('ADMIN_EMAIL is not a valid email address. Super Admin was not created.');
    return;
  }

  const byEmail = db.prepare('SELECT * FROM users WHERE lower(email)=?').get(ADMIN_EMAIL);
  if (byEmail && !['SUPER_ADMIN', 'TEACHER'].includes(byEmail.role)) {
    console.error(`ADMIN_EMAIL already belongs to a non-teacher account (${ADMIN_EMAIL}). It was not elevated automatically.`);
    return;
  }

  if (byEmail) {
    if (byEmail.email !== ADMIN_EMAIL) db.prepare('UPDATE users SET email=? WHERE id=?').run(ADMIN_EMAIL, byEmail.id);
    if (RESET_REQUESTED) {
      if (!isStrongPassword(ADMIN_PASSWORD)) {
        console.error('ADMIN_PASSWORD_RESET=1 was set, but ADMIN_PASSWORD is missing or shorter than 12 characters. Password was not changed.');
      } else if (byEmail.password_hash && bcrypt.compareSync(ADMIN_PASSWORD, byEmail.password_hash)) {
        console.log(`Teacher password for ${ADMIN_EMAIL} already matches ADMIN_PASSWORD; no reset needed.`);
      } else {
        db.prepare('UPDATE users SET password_hash=?, status=?, session_token_version=session_token_version+1 WHERE id=?')
          .run(bcrypt.hashSync(ADMIN_PASSWORD, 10), 'APPROVED', byEmail.id);
        try { db.prepare('INSERT INTO audit_logs(user_id,action,detail,ip) VALUES(?,?,?,?)').run(byEmail.id, 'ADMIN_PASSWORD_RESET', ADMIN_EMAIL, 'seed'); } catch {}
        console.log(`Teacher password reset completed for ${ADMIN_EMAIL}. Remove ADMIN_PASSWORD_RESET from the server environment now.`);
      }
    } else {
      console.log(`Teacher account already exists: ${ADMIN_EMAIL}. Existing password was not changed.`);
    }
    return;
  }

  const existingSuper = db.prepare("SELECT email FROM users WHERE role='SUPER_ADMIN' ORDER BY id LIMIT 1").get();
  if (existingSuper) {
    console.log(`A Super Admin already exists (${existingSuper.email}). A second account was not created merely because ADMIN_EMAIL changed.`);
    return;
  }

  if (!ADMIN_PASSWORD) {
    console.error('No Super Admin exists and ADMIN_PASSWORD is not set. Set a strong ADMIN_PASSWORD (12+ characters), then redeploy/run seed again. No default password was created.');
    return;
  }
  if (!isStrongPassword(ADMIN_PASSWORD)) {
    console.error('ADMIN_PASSWORD must be at least 12 characters. Super Admin was not created.');
    return;
  }

  db.prepare("INSERT INTO users(role,name,email,password_hash,status) VALUES('SUPER_ADMIN','Dream Sir',?,?,'APPROVED')")
    .run(ADMIN_EMAIL, bcrypt.hashSync(ADMIN_PASSWORD, 10));
  console.log(`Super Admin created for ${ADMIN_EMAIL} using the password supplied through ADMIN_PASSWORD.`);
}

function seedSampleContentOnce() {
  const marker = getSetting('sample_content_seeded_v1', '');
  if (marker) {
    console.log('Sample content was already initialized once; seed will not recreate deleted items.');
    return;
  }

  const classCount = db.prepare('SELECT COUNT(*) n FROM classes').get().n;
  if (classCount > 0) {
    setSetting('sample_content_seeded_v1', new Date().toISOString());
    console.log('Existing learning content found. It was preserved and marked as initialized.');
    return;
  }

  const addClass = db.prepare('INSERT INTO classes(name,sort) VALUES(?,?)');
  const addSub = db.prepare('INSERT INTO subjects(class_id,name,icon,sort) VALUES(?,?,?,?)');
  const addChap = db.prepare('INSERT INTO chapters(subject_id,name,sort) VALUES(?,?,?)');
  const addBatch = db.prepare('INSERT INTO batches(name,class_id,description) VALUES(?,?,?)');
  const subs = [['Mathematics', '📐'], ['Science', '🔬'], ['English', '📖'], ['Hindi', '✍️'], ['Social Science', '🌍']];

  ['Class 9', 'Class 10', 'Class 11', 'Class 12'].forEach((cn, ci) => {
    const cid = addClass.run(cn, ci).lastInsertRowid;
    subs.forEach(([sn, ic], si) => {
      const sid = addSub.run(cid, sn, ic, si).lastInsertRowid;
      if (ci === 1 && si === 0) ['Real Numbers', 'Triangles', 'Quadratic Equations'].forEach((ch, i) => addChap.run(sid, ch, i));
      if (ci === 1 && si === 1) ['Chemical Reactions', 'Light – Reflection & Refraction'].forEach((ch, i) => addChap.run(sid, ch, i));
    });
    addBatch.run(cn + ' Batch', cid, 'Main batch for ' + cn);
  });
  addBatch.run('Foundation', null, 'Foundation course batch');
  addBatch.run('Special Practice', null, 'Extra practice batch');

  const chap = db.prepare("SELECT id FROM chapters WHERE name='Real Numbers' ORDER BY id LIMIT 1").get();
  if (chap) {
    const tid = db.prepare("INSERT INTO tests(title,instructions,chapter_id,duration_min,negative_mark,show_answers,state) VALUES('Real Numbers – Practice Test 1','Attempt all questions. No negative marking in this practice test.',?,20,0,1,'PUBLISHED')").run(chap.id).lastInsertRowid;
    const q = db.prepare('INSERT INTO questions(test_id,text,options,correct,marks,explanation,sort) VALUES(?,?,?,?,?,?,?)');
    q.run(tid, 'HCF of 12 and 18 is?', JSON.stringify(['2', '3', '6', '9']), 2, 1, '12 = 2²×3, 18 = 2×3² → HCF = 2×3 = 6.', 0);
    q.run(tid, 'Which of these is an irrational number?', JSON.stringify(['22/7', '√2', '0.5', '3/4']), 1, 1, '√2 cannot be written as p/q.', 1);
    q.run(tid, 'LCM of 4 and 6 is?', JSON.stringify(['24', '12', '6', '4']), 1, 1, 'Multiples of 6: 6, 12 → LCM = 12.', 2);

    const pq = db.prepare('INSERT INTO practice_questions(chapter_id,text,options,correct,explanation,sort) VALUES(?,?,?,?,?,?)');
    pq.run(chap.id, 'HCF × LCM for two numbers 12 and 18 equals?', JSON.stringify(['108', '216', '36', '6']), 1, 'HCF=6, LCM=36 → 6×36=216 = 12×18.', 0);
    pq.run(chap.id, 'The decimal expansion of 7/8 is…', JSON.stringify(['Non-terminating', '0.875 (terminating)', '0.777…', 'Irrational']), 1, '8 = 2³, so the decimal terminates: 0.875.', 1);
    pq.run(chap.id, 'Which is a prime number?', JSON.stringify(['21', '27', '29', '33']), 2, '29 has only two factors: 1 and 29.', 2);
  }

  db.prepare("INSERT INTO announcements(title,body) VALUES('Welcome to Dream Classes 🎓','Classes by Dream Sir — Kothwara, Dobhi, Gaya (Bihar). New lectures and notes will appear here. All the best!')").run();
  setSetting('sample_content_seeded_v1', new Date().toISOString());
  console.log('Initial editable structure created (Class 9–12, subjects, batches, one sample test and practice set).');
}

ensureSuperAdmin();
seedSampleContentOnce();
