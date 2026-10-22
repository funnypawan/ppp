import http from 'node:http';
import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, 'data');
const storePath = path.join(dataDir, 'store.json');
const port = Number(process.env.PORT || 4173);
const isProduction = process.env.NODE_ENV === 'production';
const authSecret = process.env.AUTH_SECRET || 'local-demo-secret-change-before-production';
const demoOtp = process.env.DEMO_OTP || '123456';
const otpRequests = new Map();
let db;
let writeQueue = Promise.resolve();

if (isProduction && !process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET must be set before running in production.');
}

function seedData() {
  return {
    students: [
      { id: 'stu-01', name: 'Aarav Sharma', initials: 'AS', grade: 'Class 11 · JEE', batch: 'JEE Rank Booster 2027', joined: '12 Aug 2026', activity: 'Today', status: 'Active' },
      { id: 'stu-02', name: 'Sana Verma', initials: 'SV', grade: 'Class 11 · JEE', batch: 'JEE Rank Booster 2027', joined: '16 Aug 2026', activity: 'Today', status: 'Active' },
      { id: 'stu-03', name: 'Kabir Mehta', initials: 'KM', grade: 'Class 12 · NEET', batch: 'NEET Achiever Batch', joined: '22 Aug 2026', activity: 'Yesterday', status: 'Active' },
      { id: 'stu-04', name: 'Isha Singh', initials: 'IS', grade: 'Class 10 · Boards', batch: 'Class 10 Board Sprint', joined: '02 Sep 2026', activity: '3 days ago', status: 'Active' },
      { id: 'stu-05', name: 'Dev Patel', initials: 'DP', grade: 'Class 11 · JEE', batch: 'JEE Rank Booster 2027', joined: '04 Sep 2026', activity: '12 Oct', status: 'Blocked' },
    ],
    faculty: [
      { id: 'fac-01', name: 'Dr. Rohan Sen', initials: 'RS', subject: 'Physics', batches: '4 batches', sessions: '28 this month', status: 'Active' },
      { id: 'fac-02', name: 'Meera Iyer', initials: 'MI', subject: 'Mathematics', batches: '3 batches', sessions: '24 this month', status: 'Active' },
      { id: 'fac-03', name: 'Aditi Kapoor', initials: 'AK', subject: 'Chemistry', batches: '3 batches', sessions: '21 this month', status: 'Active' },
      { id: 'fac-04', name: 'Nikhil Das', initials: 'ND', subject: 'Biology', batches: '2 batches', sessions: '16 this month', status: 'Invited' },
    ],
    batches: [
      { id: 'batch-01', name: 'JEE Rank Booster 2027', grade: 'Class 11 · JEE', students: 2840, price: 4999, status: 'Live', start: '02 Nov 2026', subjects: 'Physics, Chemistry, Mathematics' },
      { id: 'batch-02', name: 'NEET Achiever Batch', grade: 'Class 11 · NEET', students: 1960, price: 5499, status: 'Live', start: '09 Nov 2026', subjects: 'Physics, Chemistry, Biology' },
      { id: 'batch-03', name: 'Class 10 Board Sprint', grade: 'Class 10 · Boards', students: 1320, price: 1999, status: 'Draft', start: '04 Nov 2026', subjects: 'Mathematics, Science' },
    ],
    classes: [],
    tests: [
      { id: 'test-01', title: 'Laws of Motion · Chapter Test', batch: 'JEE Rank Booster 2027', questions: 20, date: 'Today · 7:00 PM', status: 'Scheduled' },
      { id: 'test-02', title: 'Chemical Bonding · Unit Test', batch: 'JEE Rank Booster 2027', questions: 25, date: '24 Oct · 10:00 AM', status: 'Draft' },
      { id: 'test-03', title: 'NEET Mini Mock 03', batch: 'NEET Achiever Batch', questions: 90, date: '25 Oct · 9:00 AM', status: 'Published' },
    ],
    content: [],
    doubts: [
      { id: 'd1', studentName: 'Sana Verma', title: 'How do I find the direction of friction here?', subject: 'Physics', body: 'I am confused about the block on the rough incline. Does friction always oppose the direction of motion?', status: 'Answered', time: 'Yesterday · 6:42 PM', answer: 'Friction opposes the relative tendency of motion between surfaces. Start by drawing the direction the block would move without friction.' },
      { id: 'd2', studentName: 'Kabir Mehta', title: 'Can someone explain the chain rule?', subject: 'Mathematics', body: 'I understand the formula but I am not sure when to apply it in composite functions.', status: 'In review', time: '20 Oct · 4:18 PM' },
    ],
    communityPosts: [],
    notifications: [],
    transactions: [
      { id: 'txn-2401', name: 'Sana Verma', item: 'JEE Rank Booster 2027', amount: 4999, date: '22 Oct 2026 · 09:42', status: 'Paid' },
      { id: 'txn-2399', name: 'Kabir Mehta', item: 'NEET Achiever Batch', amount: 5499, date: '22 Oct 2026 · 08:17', status: 'Paid' },
      { id: 'txn-2394', name: 'Isha Singh', item: 'Class 10 Board Sprint', amount: 1999, date: '21 Oct 2026 · 19:33', status: 'Refund requested' },
      { id: 'txn-2390', name: 'Aarav Sharma', item: 'JEE Rank Booster 2027', amount: 4999, date: '21 Oct 2026 · 16:05', status: 'Paid' },
    ],
  };
}

async function initializeStore() {
  await mkdir(dataDir, { recursive: true });
  try {
    const stored = JSON.parse(await readFile(storePath, 'utf8'));
    const defaults = seedData();
    db = { ...defaults, ...stored };
    for (const [key, value] of Object.entries(defaults)) {
      if (!Array.isArray(db[key])) db[key] = value;
    }
  } catch {
    db = seedData();
    await persistStore();
  }
}

function persistStore() {
  const snapshot = JSON.stringify(db, null, 2);
  writeQueue = writeQueue.catch(() => {}).then(async () => {
    const tempPath = `${storePath}.tmp`;
    await writeFile(tempPath, snapshot, 'utf8');
    await rename(tempPath, storePath);
  });
  return writeQueue;
}

function json(res, statusCode, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error('Request body must be valid JSON.')); }
    });
    req.on('error', reject);
  });
}

function signSession(user) {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = createHmac('sha256', authSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readSession(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith('dream_session='));
  if (!cookie) return null;
  const token = decodeURIComponent(cookie.slice('dream_session='.length));
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = createHmac('sha256', authSecret).update(payload).digest('base64url');
  const suppliedBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) return null;
  try {
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!user.exp || user.exp < Date.now() || !['student', 'admin'].includes(user.role)) return null;
    return user;
  } catch { return null; }
}

function sessionCookie(token, req) {
  const secure = isProduction || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  return `dream_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${secure}`;
}

function requireRole(req, res, role) {
  const user = readSession(req);
  if (!user) {
    json(res, 401, { error: 'Please sign in to continue.' });
    return null;
  }
  if (role && user.role !== role) {
    json(res, 403, { error: 'This workspace is not available for your account.' });
    return null;
  }
  return user;
}

function newId(prefix) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

const collectionRoutes = {
  students: ['students', 'student'],
  faculty: ['faculty', 'faculty'],
  batches: ['batches', 'batch'],
  classes: ['classes', 'class'],
  tests: ['tests', 'test'],
  content: ['content', 'content'],
  notifications: ['notifications', 'notice'],
  transactions: ['transactions', 'txn'],
};

async function handleApi(req, res, url) {
  const route = url.pathname;
  const method = req.method || 'GET';

  if (route === '/api/health' && method === 'GET') {
    return json(res, 200, { ok: true, service: 'dream-classes', mode: isProduction ? 'production' : 'development' });
  }

  if (route === '/api/auth/request-otp' && method === 'POST') {
    if (isProduction) return json(res, 503, { error: 'SMS delivery is not configured for production.' });
    const body = await readBody(req);
    const role = body.role;
    const phone = String(body.phone || '').replace(/[^\d]/g, '').slice(-15);
    if (!['student', 'admin'].includes(role)) return json(res, 400, { error: 'Choose Student or Admin login.' });
    if (phone.length < 10) return json(res, 400, { error: 'Enter a valid mobile number with at least 10 digits.' });
    const key = `${role}:${phone}`;
    const previous = otpRequests.get(key);
    if (previous && previous.requestedAt + 20_000 > Date.now()) {
      return json(res, 429, { error: 'Please wait a few seconds before requesting another code.' });
    }
    const code = process.env.DEMO_OTP ? demoOtp : String(randomInt(100000, 1000000));
    otpRequests.set(key, { code, requestedAt: Date.now(), expiresAt: Date.now() + 5 * 60_000 });
    return json(res, 200, {
      ok: true,
      expiresIn: 300,
      demoOtp: code,
      message: 'Development demo: no SMS was sent. Use the displayed one-time code.',
    });
  }

  if (route === '/api/auth/verify-otp' && method === 'POST') {
    const body = await readBody(req);
    const role = body.role;
    const phone = String(body.phone || '').replace(/[^\d]/g, '').slice(-15);
    const key = `${role}:${phone}`;
    const record = otpRequests.get(key);
    if (!record || record.expiresAt < Date.now() || String(body.otp || '') !== record.code) {
      return json(res, 401, { error: 'That code is incorrect or has expired. Request a new one and try again.' });
    }
    otpRequests.delete(key);
    const user = {
      role,
      phone,
      name: role === 'admin' ? 'Ronny Raj' : 'Aarav Sharma',
      initials: role === 'admin' ? 'RR' : 'AS',
      className: role === 'student' ? 'Class 11 · JEE aspirant' : 'Super Admin',
    };
    return json(res, 200, { ok: true, user }, { 'Set-Cookie': sessionCookie(signSession(user), req) });
  }

  if (route === '/api/auth/logout' && method === 'POST') {
    const secure = isProduction || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
    return json(res, 200, { ok: true }, { 'Set-Cookie': `dream_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}` });
  }

  if (route === '/api/me' && method === 'GET') {
    const user = requireRole(req, res);
    if (!user) return;
    return json(res, 200, { user });
  }

  if (route.startsWith('/api/admin/')) {
    const user = requireRole(req, res, 'admin');
    if (!user) return;
    if (route === '/api/admin/stats' && method === 'GET') {
      return json(res, 200, {
        totalStudents: 18426,
        activeStudents: db.students.filter((student) => student.status === 'Active').length,
        revenueThisMonth: 1284600,
        scheduledClasses: db.classes.length + 6,
        weeklyEngagement: 76.4,
      });
    }
    const match = route.match(/^\/api\/admin\/(students|faculty|batches|classes|tests|content|notifications|transactions|doubts)(?:\/([^/]+))?(?:\/(assign|resolve))?$/);
    if (!match) return json(res, 404, { error: 'Admin endpoint not found.' });
    const [, routeName, itemId, operation] = match;
    const collectionName = routeName === 'doubts' ? 'doubts' : collectionRoutes[routeName]?.[0];
    if (!collectionName) return json(res, 404, { error: 'Admin collection not found.' });
    const collection = db[collectionName];

    if (!itemId && method === 'GET') return json(res, 200, { items: collection });
    if (!itemId && method === 'POST') {
      const body = await readBody(req);
      const prefix = routeName === 'doubts' ? 'd' : (collectionRoutes[routeName]?.[1] || 'item');
      const item = { ...body, id: body.id || newId(prefix), createdAt: new Date().toISOString() };
      collection.unshift(item);
      await persistStore();
      return json(res, 201, { item, items: collection });
    }
    if (itemId && routeName === 'doubts' && method === 'POST' && ['assign', 'resolve'].includes(operation)) {
      const item = collection.find((entry) => entry.id === itemId);
      if (!item) return json(res, 404, { error: 'Doubt not found.' });
      item.status = operation === 'resolve' ? 'Answered' : 'Assigned';
      item.assignedTo = operation === 'assign' ? 'Subject faculty' : item.assignedTo;
      await persistStore();
      return json(res, 200, { item });
    }
    if (itemId && method === 'PATCH') {
      const item = collection.find((entry) => entry.id === itemId);
      if (!item) return json(res, 404, { error: 'Record not found.' });
      const body = await readBody(req);
      Object.assign(item, body, { id: itemId });
      await persistStore();
      return json(res, 200, { item });
    }
    return json(res, 405, { error: 'Method not allowed for this endpoint.' });
  }

  if (route.startsWith('/api/student/')) {
    const user = requireRole(req, res, 'student');
    if (!user) return;
    if (route === '/api/student/doubts' && method === 'GET') {
      return json(res, 200, { items: db.doubts.filter((item) => item.studentPhone === user.phone) });
    }
    if (route === '/api/student/doubts' && method === 'POST') {
      const body = await readBody(req);
      const title = String(body.title || '').trim();
      const description = String(body.body || '').trim();
      if (!title || !description) return json(res, 400, { error: 'A title and question are required.' });
      if (title.length > 100 || description.length > 1200) return json(res, 400, { error: 'Keep the title under 100 characters and the question under 1,200.' });
      const item = {
        id: newId('d'),
        studentPhone: user.phone,
        studentName: user.name,
        subject: String(body.subject || 'Physics'),
        title,
        body: description,
        status: 'In review',
        time: 'Just now',
        createdAt: new Date().toISOString(),
      };
      db.doubts.unshift(item);
      await persistStore();
      return json(res, 201, { item });
    }
    if (route === '/api/student/community' && method === 'GET') {
      return json(res, 200, { items: db.communityPosts });
    }
    if (route === '/api/student/community' && method === 'POST') {
      const body = await readBody(req);
      const text = String(body.text || '').trim();
      if (!text) return json(res, 400, { error: 'Write something before posting.' });
      if (text.length > 500) return json(res, 400, { error: 'Keep a community post under 500 characters.' });
      const item = {
        id: newId('post'),
        name: user.name,
        initials: user.initials,
        time: 'Just now',
        subject: String(body.subject || 'JEE 2027'),
        title: text.length > 86 ? `${text.slice(0, 83)}…` : text,
        text,
        votes: 0,
        replies: 0,
        verified: false,
        createdAt: new Date().toISOString(),
      };
      db.communityPosts.unshift(item);
      await persistStore();
      return json(res, 201, { item });
    }
    return json(res, 404, { error: 'Student endpoint not found.' });
  }

  return json(res, 404, { error: 'API endpoint not found.' });
}

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

async function serveStatic(req, res, url) {
  if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end('Method Not Allowed');
  }
  const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const filePath = path.resolve(root, `.${pathname}`);
  if (!filePath.startsWith(`${root}${path.sep}`) || pathname.startsWith('/data/') || pathname.startsWith('/.git/')) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  try {
    const content = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
      'Cache-Control': 'no-cache',
    });
    if (req.method === 'HEAD') return res.end();
    return res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Not Found');
  }
}

const server = http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url || '/', 'http://localhost'); }
  catch { return json(res, 400, { error: 'Malformed URL.' }); }
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    return await serveStatic(req, res, url);
  } catch (error) {
    console.error(`[server] ${req.method} ${url.pathname}:`, error.message);
    if (!res.headersSent) return json(res, 500, { error: 'Something went wrong. Please try again.' });
    res.destroy();
  }
});

await initializeStore();
server.listen(port, '0.0.0.0', () => {
  console.log(`Dream Classes listening on http://0.0.0.0:${port}`);
  console.log(`Environment: ${isProduction ? 'production' : 'development'} · Demo OTP: ${isProduction ? 'disabled' : 'shown after request'}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
