// Seed: Super Admin (Dream Sir) + demo structure. Demo content is clearly labelled and deletable from Admin Panel.
const bcrypt = require('bcryptjs');
const { db } = require('./db');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@dreamclasses.in';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'Dream@12345';
if (!db.prepare('SELECT 1 FROM users WHERE email=?').get(ADMIN_EMAIL)) {
  db.prepare("INSERT INTO users(role,name,email,password_hash,status) VALUES('SUPER_ADMIN','Dream Sir',?,?,'APPROVED')").run(ADMIN_EMAIL, bcrypt.hashSync(ADMIN_PASS, 10));
  console.log('Super Admin created:', ADMIN_EMAIL, '/ (password from ADMIN_PASSWORD or default — CHANGE IT)');
}
if (db.prepare('SELECT COUNT(*) n FROM classes').get().n === 0) {
  const addClass = db.prepare('INSERT INTO classes(name,sort) VALUES(?,?)');
  const addSub = db.prepare('INSERT INTO subjects(class_id,name,icon,sort) VALUES(?,?,?,?)');
  const addChap = db.prepare('INSERT INTO chapters(subject_id,name,sort) VALUES(?,?,?)');
  const addBatch = db.prepare('INSERT INTO batches(name,class_id,description) VALUES(?,?,?)');
  const subs = [['Mathematics', '📐'], ['Science', '🔬'], ['English', '📖'], ['Hindi', '✍️'], ['Social Science', '🌍']];
  ['Class 9', 'Class 10', 'Class 11', 'Class 12'].forEach((cn, ci) => {
    const cid = addClass.run(cn, ci).lastInsertRowid;
    subs.forEach(([sn, ic], si) => {
      const sid = addSub.run(cid, sn, ic, si).lastInsertRowid;
      if (ci === 1 && si === 0) { ['Real Numbers', 'Triangles', 'Quadratic Equations'].forEach((ch, i) => addChap.run(sid, ch, i)); }
      if (ci === 1 && si === 1) { ['Chemical Reactions', 'Light – Reflection & Refraction'].forEach((ch, i) => addChap.run(sid, ch, i)); }
    });
    addBatch.run(cn + ' Batch', cid, 'Main batch for ' + cn);
  });
  addBatch.run('Foundation', null, 'Foundation course batch');
  addBatch.run('Special Practice', null, 'Extra practice batch');
  // One sample published test on Class 10 → Mathematics → Real Numbers
  const chap = db.prepare("SELECT id FROM chapters WHERE name='Real Numbers'").get();
  if (chap) {
    const tid = db.prepare("INSERT INTO tests(title,instructions,chapter_id,duration_min,negative_mark,show_answers,state) VALUES('Real Numbers – Practice Test 1','Attempt all questions. No negative marking in this practice test.',?,20,0,1,'PUBLISHED')").run(chap.id).lastInsertRowid;
    const q = db.prepare('INSERT INTO questions(test_id,text,options,correct,marks,explanation,sort) VALUES(?,?,?,?,?,?,?)');
    q.run(tid, 'HCF of 12 and 18 is?', JSON.stringify(['2', '3', '6', '9']), 2, 1, '12 = 2²×3, 18 = 2×3² → HCF = 2×3 = 6.', 0);
    q.run(tid, 'Which of these is an irrational number?', JSON.stringify(['22/7', '√2', '0.5', '3/4']), 1, 1, '√2 cannot be written as p/q.', 1);
    q.run(tid, 'LCM of 4 and 6 is?', JSON.stringify(['24', '12', '6', '4']), 1, 1, 'Multiples of 6: 6, 12 → LCM = 12.', 2);
  }
  db.prepare("INSERT INTO announcements(title,body) VALUES('Welcome to Dream Classes 🎓','Classes by Dream Sir — Kothwara, Dobhi, Gaya (Bihar). New lectures and notes will appear here. All the best!')").run();
  console.log('Seed structure created (Class 9-12, subjects, batches, 1 sample test).');
} else console.log('Database already has data — seed skipped.');
// Sample practice questions (idempotent)
if (db.prepare('SELECT COUNT(*) n FROM practice_questions').get().n === 0) {
  const chap = db.prepare("SELECT id FROM chapters WHERE name='Real Numbers'").get();
  if (chap) {
    const pq = db.prepare('INSERT INTO practice_questions(chapter_id,text,options,correct,explanation,sort) VALUES(?,?,?,?,?,?)');
    pq.run(chap.id, 'HCF × LCM for two numbers 12 and 18 equals?', JSON.stringify(['108', '216', '36', '6']), 1, 'HCF=6, LCM=36 → 6×36=216 = 12×18.', 0);
    pq.run(chap.id, 'The decimal expansion of 7/8 is…', JSON.stringify(['Non-terminating', '0.875 (terminating)', '0.777…', 'Irrational']), 1, '8 = 2³, so the decimal terminates: 0.875.', 1);
    pq.run(chap.id, 'Which is a prime number?', JSON.stringify(['21', '27', '29', '33']), 2, '29 has only two factors: 1 and 29.', 2);
    console.log('Seeded 3 practice questions.');
  }
}
