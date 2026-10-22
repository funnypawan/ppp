// Dream Classes — database layer (SQLite via Node's built-in node:sqlite, zero native deps).
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const raw = new DatabaseSync(path.join(dataDir, 'dream.db'));
// Thin adapter: better-sqlite3-style prepare().get/all/run returning {lastInsertRowid}
const db = {
  exec: sql => raw.exec(sql),
  prepare: sql => {
    const st = raw.prepare(sql);
    return {
      get: (...a) => st.get(...a),
      all: (...a) => st.all(...a).map(r => ({ ...r })),
      run: (...a) => { const r = st.run(...a); return { changes: r.changes, lastInsertRowid: Number(r.lastInsertRowid) }; }
    };
  }
};
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK(role IN ('SUPER_ADMIN','TEACHER','STUDENT')),
  name TEXT NOT NULL, mobile TEXT UNIQUE, email TEXT UNIQUE,
  password_hash TEXT, photo TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','BLOCKED','SUSPENDED','REJECTED')),
  class_id INTEGER, batch_id INTEGER,
  device_id TEXT, session_token_version INTEGER NOT NULL DEFAULT 0,
  fcm_token TEXT, created_at TEXT DEFAULT (datetime('now')), last_login TEXT
);
CREATE TABLE IF NOT EXISTS otps (id INTEGER PRIMARY KEY AUTOINCREMENT, mobile TEXT, code_hash TEXT, expires_at INTEGER, attempts INTEGER DEFAULT 0, created_at INTEGER);
CREATE TABLE IF NOT EXISTS classes (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, sort INTEGER DEFAULT 0, published INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY AUTOINCREMENT, class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE, name TEXT NOT NULL, icon TEXT DEFAULT '📚', sort INTEGER DEFAULT 0, published INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS chapters (id INTEGER PRIMARY KEY AUTOINCREMENT, subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, sort INTEGER DEFAULT 0, published INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS batches (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, class_id INTEGER, description TEXT, active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS batch_classes (batch_id INTEGER, class_id INTEGER, PRIMARY KEY(batch_id,class_id));
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
  source_type TEXT DEFAULT 'url' CHECK(source_type IN ('url','upload','youtube')),
  url TEXT, file_path TEXT, qualities TEXT DEFAULT '[]', thumbnail TEXT,
  duration_sec INTEGER DEFAULT 0, downloadable INTEGER DEFAULT 0,
  published INTEGER DEFAULT 0, sort INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS video_batches (video_id INTEGER, batch_id INTEGER, PRIMARY KEY(video_id,batch_id));
CREATE TABLE IF NOT EXISTS pdf_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
  file_path TEXT, url TEXT, downloadable INTEGER DEFAULT 1, published INTEGER DEFAULT 0,
  sort INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS pdf_batches (pdf_id INTEGER, batch_id INTEGER, PRIMARY KEY(pdf_id,batch_id));
CREATE TABLE IF NOT EXISTS tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, instructions TEXT,
  chapter_id INTEGER, duration_min INTEGER DEFAULT 30, negative_mark REAL DEFAULT 0,
  show_answers INTEGER DEFAULT 1, state TEXT DEFAULT 'DRAFT' CHECK(state IN ('DRAFT','SCHEDULED','PUBLISHED','CLOSED')),
  starts_at TEXT, ends_at TEXT, created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS test_batches (test_id INTEGER, batch_id INTEGER, PRIMARY KEY(test_id,batch_id));
CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY AUTOINCREMENT, test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE, text TEXT NOT NULL, options TEXT NOT NULL, correct INTEGER NOT NULL, marks REAL DEFAULT 1, explanation TEXT, sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS test_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, test_id INTEGER, student_id INTEGER,
  answers TEXT DEFAULT '{}', started_at INTEGER, submitted_at INTEGER,
  score REAL, total REAL, correct_cnt INTEGER, wrong_cnt INTEGER, skipped_cnt INTEGER,
  time_taken_sec INTEGER, status TEXT DEFAULT 'IN_PROGRESS', UNIQUE(test_id, student_id, status)
);
CREATE TABLE IF NOT EXISTS doubts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, chapter_id INTEGER,
  subject_id INTEGER, class_id INTEGER, question TEXT NOT NULL, image TEXT,
  status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING','IN_PROGRESS','ANSWERED','RESOLVED')),
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS doubt_replies (id INTEGER PRIMARY KEY AUTOINCREMENT, doubt_id INTEGER REFERENCES doubts(id) ON DELETE CASCADE, author_id INTEGER, author_role TEXT, text TEXT, image TEXT, pdf TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, message TEXT, image TEXT, target_type TEXT, target_id INTEGER, sent_by INTEGER, status TEXT DEFAULT 'SENT', scheduled_at TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS notification_reads (notification_id INTEGER, user_id INTEGER, PRIMARY KEY(notification_id,user_id));
CREATE TABLE IF NOT EXISTS announcements (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, body TEXT, batch_id INTEGER, created_by INTEGER, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS progress (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, video_id INTEGER, position_sec INTEGER DEFAULT 0, completed INTEGER DEFAULT 0, updated_at TEXT DEFAULT (datetime('now')), UNIQUE(student_id,video_id));
CREATE TABLE IF NOT EXISTS pdf_progress (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, pdf_id INTEGER, page INTEGER DEFAULT 1, updated_at TEXT DEFAULT (datetime('now')), UNIQUE(student_id,pdf_id));
CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, action TEXT, detail TEXT, ip TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS push_subscriptions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, endpoint TEXT UNIQUE, keys TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS practice_questions (id INTEGER PRIMARY KEY AUTOINCREMENT, chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE, text TEXT NOT NULL, options TEXT NOT NULL, correct INTEGER NOT NULL, explanation TEXT, sort INTEGER DEFAULT 0, published INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS practice_answers (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, question_id INTEGER, correct INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), UNIQUE(student_id,question_id));
CREATE INDEX IF NOT EXISTS idx_practice_chapter ON practice_questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_subjects_class ON subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_chapters_subject ON chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_videos_chapter ON videos(chapter_id);
CREATE INDEX IF NOT EXISTS idx_pdfs_chapter ON pdf_notes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON test_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_doubts_student ON doubts(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_student ON progress(student_id);
`);

const getSetting = (k, d) => { const r = db.prepare('SELECT value FROM settings WHERE key=?').get(k); return r ? r.value : d; };
const setSetting = (k, v) => db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k, String(v));
if (!db.prepare('SELECT 1 FROM settings WHERE key=?').get('approval_mode')) setSetting('approval_mode', 'MANUAL');
if (!db.prepare('SELECT 1 FROM settings WHERE key=?').get('institute_name')) setSetting('institute_name', 'Dream Classes');

module.exports = { db, getSetting, setSetting };
