/* Dream Classes · student and admin learning workspace prototype */

const iconPaths = {
  spark: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>',
  book: '<path d="M4 5.8A2.8 2.8 0 0 1 6.8 3H20v16H6.8A2.8 2.8 0 0 0 4 21V5.8Z"/><path d="M4 18.5a2.5 2.5 0 0 1 2.5-2.5H20M8 7h8M8 10h6"/>',
  video: '<rect x="3" y="5" width="13" height="14" rx="3"/><path d="m16 10 5-3v10l-5-3"/><path d="m8.5 9 4 3-4 3V9Z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2"/><path d="m16.5 7.5 4-4M17 3.5h3.5V7"/>',
  file: '<path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10Z"/><path d="M13 3v7h7M8 14h8M8 17h6"/>',
  message: '<path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2 1-4.5A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01"/>',
  users: '<path d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-5A4.5 4.5 0 0 0 2 18.5V20"/><circle cx="9" cy="7" r="4"/><path d="M18 8a3.5 3.5 0 0 1 0 6.8M22 20v-1.5a4.5 4.5 0 0 0-3.3-4.3"/>',
  chart: '<path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 6-7"/><path d="M17 6h3v3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.1.9-1.5 2.6-1.4-.6a7.5 7.5 0 0 1-1.7 1l-.2 1.5h-3l-.3-1.5a7.5 7.5 0 0 1-1.7-1l-1.4.6-1.5-2.6 1.2-.9a7.2 7.2 0 0 1 0-2l-1.2-.9 1.5-2.6 1.4.6a7.5 7.5 0 0 1 1.7-1l.3-1.5h3l.2 1.5a7.5 7.5 0 0 1 1.7 1l1.4-.6 1.5 2.6-1.1.9a7.2 7.2 0 0 1 0 2Z" transform="translate(-1.5 -1.5) scale(1.12)"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
  bell: '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>',
  chevronDown: '<path d="m7 10 5 5 5-5"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowUpRight: '<path d="M7 17 17 7M8 7h9v9"/>',
  play: '<path d="m9 6 10 6-10 6V6Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4"/>',
  flame: '<path d="M12 22c4.4 0 7-3.1 7-7.1 0-3.1-1.8-5.6-4.6-8.9.1 2.3-1.1 3.2-2 3.6C12.7 5.4 11.2 3.2 8 2c.8 4.2-4 6.7-4 12.9C4 19.3 7.1 22 12 22Z"/><path d="M12 22c2.1 0 3.5-1.4 3.5-3.4 0-1.4-.8-2.6-2.3-4-.1 1.1-.6 1.5-1.2 1.7-.1-1.4-.8-2.5-2.1-3.2.3 2-1.4 3.1-1.4 5.3 0 2.2 1.4 3.6 3.5 3.6Z"/>',
  trending: '<path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16.5 9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 17v3h14v-3"/>',
  upload: '<path d="M12 16V4m0 0L8 8m4-4 4 4"/><path d="M4 16v4h16v-4"/>',
  bookmark: '<path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z"/>',
  filter: '<path d="M4 6h16M7 12h10m-7 6h4"/>',
  sparkle: '<path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 1 1 4.5 1.8c-1.2 1.1-2 1.5-2 3.2M12 17.5h.01"/>',
  send: '<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  x: '<path d="m18 6-12 12M6 6l12 12"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  moon: '<path d="M20.5 14.2A8.6 8.6 0 0 1 9.8 3.5 8.8 8.8 0 1 0 20.5 14.2Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
  paperclip: '<path d="m21.4 11.1-8.5 8.5a5 5 0 0 1-7.1-7.1l9.2-9.2a3.5 3.5 0 0 1 5 5l-9.2 9.2a2 2 0 1 1-2.8-2.8l8.5-8.5"/>',
  bookOpen: '<path d="M12 7v14M3 18V5a2 2 0 0 1 2-2h3a4 4 0 0 1 4 4 4 4 0 0 1 4-4h3a2 2 0 0 1 2 2v13h-5a4 4 0 0 0-4 3 4 4 0 0 0-4-3H3Z"/>',
  zap: '<path d="m13 2-3 9h7l-6 11 1-9H5l8-11Z"/>',
  messageCircle: '<path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2 1-4.5A7.5 7.5 0 1 1 20 11.5Z"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="m8.2 13-1 8 4.8-2.5 4.8 2.5-1-8"/><path d="m9.7 8 1.5 1.5L14.5 6"/>',
  atom: '<circle cx="12" cy="12" r="1.4"/><ellipse cx="12" cy="12" rx="9" ry="4"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
  calculator: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8v4H8zM8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01M16 18h.01"/>',
  flask: '<path d="M9 3h6m-5 0v6L4 19a1.5 1.5 0 0 0 1.3 2h13.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/>',
  heart: '<path d="M20.8 8.7c0 4.4-8.8 10.2-8.8 10.2S3.2 13.1 3.2 8.7a4.4 4.4 0 0 1 8.8-1.1 4.4 4.4 0 0 1 8.8 1.1Z"/>',
  usersRound: '<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 1 1 4.4 1.6c-1.3 1.2-2.1 1.5-2.1 3.4M12 17.5h.01"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>',
  clock3: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 1M4 17l2 1a7 7 0 0 0 12.4-3"/>',
  document: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  calendarCheck: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M16 3v4M8 3v4M3 10h18m3 3 2 2 4-4"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5h-5a2 2 0 0 0 0 4h3a2 2 0 0 1 0 4h-5m3.5-10v12"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
  percent: '<path d="m19 5-14 14"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
};

function icon(name, extraClass = '') {
  return `<svg class="icon ${extraClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.spark}</svg>`;
}

const courseData = [
  {
    id: 'laws-motion', subject: 'Physics', title: 'Laws of Motion', grade: 'Class 11', exam: 'JEE',
    teacher: 'Dr. Rohan Sen', teacherInitials: 'RS', teacherColor: '', lessons: 24, duration: '18h 40m',
    art: 'art-physics', symbol: 'F = ma', progress: 68, enrolled: true, price: 0,
    description: 'Build a strong foundation in Newton’s laws, friction and connected bodies.',
    next: 'Rotational Motion · Lecture 09',
  },
  {
    id: 'calculus', subject: 'Mathematics', title: 'Limits & Derivatives', grade: 'Class 11', exam: 'JEE',
    teacher: 'Meera Iyer', teacherInitials: 'MI', teacherColor: 'avatar-violet', lessons: 32, duration: '22h 15m',
    art: 'art-maths', symbol: 'dy/dx', progress: 42, enrolled: true, price: 0,
    description: 'Make calculus intuitive with visual lessons and guided problem solving.',
    next: 'Derivatives · Lecture 06',
  },
  {
    id: 'chemical-bonding', subject: 'Chemistry', title: 'Chemical Bonding', grade: 'Class 11', exam: 'JEE',
    teacher: 'Aditi Kapoor', teacherInitials: 'AK', teacherColor: 'avatar-gold', lessons: 19, duration: '14h 10m',
    art: 'art-chemistry', symbol: 'H₂O', progress: 32, enrolled: true, price: 0,
    description: 'Explore molecular structure, hybridisation and bond theories step by step.',
    next: 'VSEPR Theory · Lecture 05',
  },
  {
    id: 'jee-foundation', subject: 'Complete batch', title: 'JEE Rank Booster 2027', grade: 'Class 11–12', exam: 'JEE',
    teacher: 'Dream Classes Faculty', teacherInitials: 'DC', teacherColor: 'avatar-blue', lessons: 240, duration: '180+ hours',
    art: 'art-biology', symbol: '2027', progress: 0, enrolled: false, price: 4999,
    description: 'A structured year-long program with live classes, tests and personal doubt support.',
    next: 'Batch begins 2 November',
  },
  {
    id: 'neet-foundation', subject: 'Complete batch', title: 'NEET Achiever Batch', grade: 'Class 11', exam: 'NEET',
    teacher: 'Dream Classes Faculty', teacherInitials: 'DC', teacherColor: 'avatar-blue', lessons: 280, duration: '210+ hours',
    art: 'art-maths', symbol: 'A + P', progress: 0, enrolled: false, price: 5499,
    description: 'Concept-first Biology, Physics and Chemistry with weekly NEET-pattern tests.',
    next: 'Batch begins 9 November',
  },
  {
    id: 'board-x', subject: 'Complete batch', title: 'Class 10 Board Sprint', grade: 'Class 10', exam: 'Boards',
    teacher: 'Dream Classes Faculty', teacherInitials: 'DC', teacherColor: 'avatar-violet', lessons: 125, duration: '96+ hours',
    art: 'art-physics', symbol: '100%', progress: 0, enrolled: false, price: 1999,
    description: 'Smart revision for Maths and Science, with sample papers and expert feedback.',
    next: 'Batch begins 4 November',
  },
];

const liveClasses = [
  { id: 'rotational', day: '22', month: 'Today', time: '11:30 AM', subject: 'Physics', title: 'Rotational Motion: Part 2', teacher: 'Dr. Rohan Sen', initials: 'RS', color: '', status: 'Live room opens at 11:25 AM', action: 'Join class' },
  { id: 'hybridisation', day: '22', month: 'Today', time: '3:00 PM', subject: 'Chemistry', title: 'Hybridisation & Molecular Shapes', teacher: 'Aditi Kapoor', initials: 'AK', color: 'avatar-gold', status: 'Class starts at 3:00 PM', action: 'Set reminder' },
  { id: 'sequences', day: '23', month: 'Tomorrow', time: '9:00 AM', subject: 'Mathematics', title: 'Sequences and Series: Problem Practice', teacher: 'Meera Iyer', initials: 'MI', color: 'avatar-violet', status: 'Class starts tomorrow', action: 'Set reminder' },
  { id: 'work-energy', day: '24', month: 'Fri', time: '4:00 PM', subject: 'Physics', title: 'Work, Energy & Power · Revision', teacher: 'Dr. Rohan Sen', initials: 'RS', color: '', status: 'Revision class', action: 'Set reminder' },
];

const materialData = [
  { id: 'm1', title: 'Laws of Motion — Class Notes', type: 'PDF', category: 'Class notes', subject: 'Physics', meta: '18 pages · 2.4 MB', date: 'Updated today', icon: 'file', tone: '' },
  { id: 'm2', title: 'Newton’s Laws · Formula Sheet', type: 'PDF', category: 'Formula sheets', subject: 'Physics', meta: '4 pages · 680 KB', date: 'Updated 18 Oct', icon: 'file', tone: 'sheet' },
  { id: 'm3', title: 'Chemical Bonding — Quick Revision', type: 'PDF', category: 'Revision notes', subject: 'Chemistry', meta: '12 pages · 1.8 MB', date: 'Updated 17 Oct', icon: 'file', tone: 'note' },
  { id: 'm4', title: 'JEE Main 2025 · Physics PYQs', type: 'PDF', category: 'PYQ', subject: 'Physics', meta: '32 questions · 3.1 MB', date: 'Added 15 Oct', icon: 'file', tone: '' },
  { id: 'm5', title: 'Limits & Derivatives — Practice Set', type: 'PDF', category: 'DPP', subject: 'Mathematics', meta: '25 questions · 1.2 MB', date: 'Added 14 Oct', icon: 'file', tone: 'sheet' },
  { id: 'm6', title: 'Class 11 Physics · Chapter 04', type: 'PDF', category: 'NCERT solutions', subject: 'Physics', meta: '26 pages · 2.8 MB', date: 'Added 10 Oct', icon: 'file', tone: 'note' },
];

const initialDoubts = [
  { id: 'd1', title: 'How do I find the direction of friction here?', subject: 'Physics', body: 'I am confused about the block on the rough incline. Does friction always oppose the direction of motion?', status: 'Answered', time: 'Yesterday · 6:42 PM', answer: 'Great question! Friction opposes the relative tendency of motion between the surfaces. Start by drawing the direction the block would move without friction.' },
  { id: 'd2', title: 'Can someone explain the chain rule?', subject: 'Mathematics', body: 'I understand the formula but I am not sure when to apply it in composite functions.', status: 'In review', time: '20 Oct · 4:18 PM' },
];

const starterPosts = [
  { id: 'p1', name: 'Sana Verma', initials: 'SV', color: 'avatar-violet', time: '18 min ago', subject: 'Physics', title: 'A quick way to remember the sign convention for work?', text: 'I keep mixing up positive and negative work in inclined plane questions. What mnemonic or diagram helps you remember it?', votes: 18, replies: 6, verified: false },
  { id: 'p2', name: 'Kabir Mehta', initials: 'KM', color: 'avatar-blue', time: '42 min ago', subject: 'Chemistry', title: 'Hybridisation shortcut from steric number', text: 'Steric number = number of sigma bonds + lone pairs on the central atom. Sharing this because it made today’s class click for me!', votes: 31, replies: 9, verified: false },
  { id: 'p3', name: 'Meera Iyer', initials: 'MI', color: 'avatar-gold', time: '2 hours ago', subject: 'Mathematics', title: 'A little reminder about limits', text: 'When direct substitution gives an indeterminate form, try factoring first. You do not always need L’Hôpital’s rule.', votes: 52, replies: 12, verified: true },
];

const questions = [
  {
    question: 'A 2 kg object is moving at 3 m/s. What is its momentum?',
    options: ['1.5 kg·m/s', '5 kg·m/s', '6 kg·m/s', '9 kg·m/s'],
    answer: 2,
    explanation: 'Momentum = mass × velocity = 2 × 3 = 6 kg·m/s.',
  },
  {
    question: 'The impulse delivered to an object is equal to its…',
    options: ['change in kinetic energy', 'change in momentum', 'average velocity', 'mass × acceleration'],
    answer: 1,
    explanation: 'Impulse is the change in momentum: J = Δp = FΔt.',
  },
  {
    question: 'A net force of 6 N acts on a 2 kg body. What is its acceleration?',
    options: ['2 m/s²', '3 m/s²', '8 m/s²', '12 m/s²'],
    answer: 1,
    explanation: 'From Newton’s second law, a = F/m = 6/2 = 3 m/s².',
  },
];

const defaultAdminStudents = [
  { id: 'stu-01', name: 'Aarav Sharma', initials: 'AS', grade: 'Class 11 · JEE', batch: 'JEE Rank Booster 2027', joined: '12 Aug 2026', activity: 'Today', status: 'Active' },
  { id: 'stu-02', name: 'Sana Verma', initials: 'SV', grade: 'Class 11 · JEE', batch: 'JEE Rank Booster 2027', joined: '16 Aug 2026', activity: 'Today', status: 'Active' },
  { id: 'stu-03', name: 'Kabir Mehta', initials: 'KM', grade: 'Class 12 · NEET', batch: 'NEET Achiever Batch', joined: '22 Aug 2026', activity: 'Yesterday', status: 'Active' },
  { id: 'stu-04', name: 'Isha Singh', initials: 'IS', grade: 'Class 10 · Boards', batch: 'Class 10 Board Sprint', joined: '02 Sep 2026', activity: '3 days ago', status: 'Active' },
  { id: 'stu-05', name: 'Dev Patel', initials: 'DP', grade: 'Class 11 · JEE', batch: 'JEE Rank Booster 2027', joined: '04 Sep 2026', activity: '12 Oct', status: 'Blocked' },
];
const defaultAdminFaculty = [
  { id: 'fac-01', name: 'Dr. Rohan Sen', initials: 'RS', subject: 'Physics', batches: '4 batches', sessions: '28 this month', status: 'Active' },
  { id: 'fac-02', name: 'Meera Iyer', initials: 'MI', subject: 'Mathematics', batches: '3 batches', sessions: '24 this month', status: 'Active' },
  { id: 'fac-03', name: 'Aditi Kapoor', initials: 'AK', subject: 'Chemistry', batches: '3 batches', sessions: '21 this month', status: 'Active' },
  { id: 'fac-04', name: 'Nikhil Das', initials: 'ND', subject: 'Biology', batches: '2 batches', sessions: '16 this month', status: 'Invited' },
];
const defaultAdminBatches = [
  { id: 'batch-01', name: 'JEE Rank Booster 2027', grade: 'Class 11 · JEE', students: 2840, price: 4999, status: 'Live', start: '02 Nov 2026', subjects: 'Physics, Chemistry, Mathematics' },
  { id: 'batch-02', name: 'NEET Achiever Batch', grade: 'Class 11 · NEET', students: 1960, price: 5499, status: 'Live', start: '09 Nov 2026', subjects: 'Physics, Chemistry, Biology' },
  { id: 'batch-03', name: 'Class 10 Board Sprint', grade: 'Class 10 · Boards', students: 1320, price: 1999, status: 'Draft', start: '04 Nov 2026', subjects: 'Mathematics, Science' },
];
const defaultAdminTests = [
  { id: 'test-01', title: 'Laws of Motion · Chapter Test', batch: 'JEE Rank Booster 2027', questions: 20, date: 'Today · 7:00 PM', status: 'Scheduled' },
  { id: 'test-02', title: 'Chemical Bonding · Unit Test', batch: 'JEE Rank Booster 2027', questions: 25, date: '24 Oct · 10:00 AM', status: 'Draft' },
  { id: 'test-03', title: 'NEET Mini Mock 03', batch: 'NEET Achiever Batch', questions: 90, date: '25 Oct · 9:00 AM', status: 'Published' },
];
const defaultAdminTransactions = [
  { id: 'txn-2401', name: 'Sana Verma', item: 'JEE Rank Booster 2027', amount: 4999, date: '22 Oct 2026 · 09:42', status: 'Paid' },
  { id: 'txn-2399', name: 'Kabir Mehta', item: 'NEET Achiever Batch', amount: 5499, date: '22 Oct 2026 · 08:17', status: 'Paid' },
  { id: 'txn-2394', name: 'Isha Singh', item: 'Class 10 Board Sprint', amount: 1999, date: '21 Oct 2026 · 19:33', status: 'Refund requested' },
  { id: 'txn-2390', name: 'Aarav Sharma', item: 'JEE Rank Booster 2027', amount: 4999, date: '21 Oct 2026 · 16:05', status: 'Paid' },
];

const readStore = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
};
const writeStore = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage is optional in this prototype. */ }
};

const state = {
  role: readStore('dream-role', 'student'),
  authReady: false,
  sessionUser: null,
  loginRole: 'student',
  loginStep: 'phone',
  loginPhone: '',
  loginOtp: '',
  demoOtp: '',
  loginError: '',
  loginBusy: false,
  view: readStore('dream-role', 'student') === 'admin' ? 'admin-overview' : 'overview',
  mobileOpen: false,
  popover: null,
  modal: null,
  query: '',
  searchOpen: false,
  courseFilter: 'All courses',
  materialFilter: 'All materials',
  materialQuery: '',
  settingsTab: 'Profile',
  language: readStore('dream-language', 'EN'),
  theme: readStore('dream-theme', 'light'),
  xp: readStore('dream-xp', 320),
  adminStudents: readStore('dream-admin-students', defaultAdminStudents),
  adminFaculty: readStore('dream-admin-faculty', defaultAdminFaculty),
  adminBatches: readStore('dream-admin-batches', defaultAdminBatches),
  adminTests: readStore('dream-admin-tests', defaultAdminTests),
  adminScheduledClasses: readStore('dream-admin-live', []),
  assignedDoubts: new Set(readStore('dream-assigned-doubts', [])),
  adminTransactions: readStore('dream-admin-transactions', defaultAdminTransactions),
  adminNotifications: readStore('dream-admin-notifications', []),
  adminContent: readStore('dream-admin-content', []),
  adminUploadName: '',
  resolvedDoubts: new Set(readStore('dream-resolved-doubts', [])),
  adminStudentFilter: 'All students',
  adminStudentQuery: '',
  savedMaterials: new Set(readStore('dream-saved-materials', [])),
  downloadedMaterials: new Set(readStore('dream-downloaded-materials', [])),
  reminders: new Set(readStore('dream-reminders', [])),
  upvotes: new Set(readStore('dream-upvotes', [])),
  customDoubts: readStore('dream-doubts', []),
  customPosts: readStore('dream-posts', []),
  attachedFilename: '',
  quiz: null,
  notificationsRead: readStore('dream-notifications-read', false),
  preferences: readStore('dream-preferences', { classReminders: true, newMaterials: true, weeklySummary: false, studyNudges: true }),
};

const app = document.getElementById('app');
const modalRoot = document.getElementById('modal-root');
const toastRoot = document.getElementById('toast-root');
let quizTimer = null;

function offlineApiRequest(url, options = {}) {
  const pathname = String(url).split('?')[0];
  const method = options.method || 'GET';
  const body = typeof options.body === 'string' ? JSON.parse(options.body || '{}') : (options.body || {});
  const readUser = () => readStore('dream-offline-user', null);
  const adminCollections = {
    students: ['adminStudents', 'dream-admin-students', 'student'],
    faculty: ['adminFaculty', 'dream-admin-faculty', 'faculty'],
    batches: ['adminBatches', 'dream-admin-batches', 'batch'],
    classes: ['adminScheduledClasses', 'dream-admin-live', 'class'],
    tests: ['adminTests', 'dream-admin-tests', 'test'],
    content: ['adminContent', 'dream-admin-content', 'cnt'],
    notifications: ['adminNotifications', 'dream-admin-notifications', 'notice'],
    doubts: ['customDoubts', 'dream-doubts', 'd'],
  };
  if (pathname === '/api/health') return { ok: true, mode: 'offline-demo' };
  if (pathname === '/api/auth/request-otp' && method === 'POST') {
    if (!['student','admin'].includes(body.role) || String(body.phone || '').replace(/\D/g, '').length < 10) throw new Error('Choose a role and enter a valid 10-digit test number.');
    writeStore('dream-offline-pending', { role: body.role, phone: String(body.phone).replace(/\D/g, '').slice(-10) });
    return { ok: true, demoOtp: '123456', expiresIn: 300, message: 'Offline demo code; no SMS is sent.' };
  }
  if (pathname === '/api/auth/verify-otp' && method === 'POST') {
    const pending = readStore('dream-offline-pending', null);
    if (!pending || pending.role !== body.role || pending.phone !== String(body.phone || '').replace(/\D/g, '').slice(-10) || String(body.otp) !== '123456') throw new Error('Use the displayed demo OTP 123456.');
    const user = { role: pending.role, phone: pending.phone, name: pending.role === 'admin' ? 'Ronny Raj' : 'Aarav Sharma', initials: pending.role === 'admin' ? 'RR' : 'AS', className: pending.role === 'admin' ? 'Super Admin' : 'Class 11 · JEE aspirant' };
    writeStore('dream-offline-user', user);
    return { ok: true, user };
  }
  if (pathname === '/api/auth/logout' && method === 'POST') {
    try { localStorage.removeItem('dream-offline-user'); localStorage.removeItem('dream-offline-pending'); } catch { /* Offline storage may be unavailable. */ }
    return { ok: true };
  }
  if (pathname === '/api/me' && method === 'GET') {
    const user = readUser();
    if (!user) throw new Error('Please sign in to continue.');
    return { user };
  }
  if (pathname.startsWith('/api/admin/')) {
    const user = readUser();
    if (!user) throw new Error('Please sign in to continue.');
    if (user.role !== 'admin') throw new Error('This workspace is not available for your account.');
    const match = pathname.match(/^\/api\/admin\/(students|faculty|batches|classes|tests|content|notifications|doubts)(?:\/([^/]+))?(?:\/(assign|resolve))?$/);
    if (!match) return { items: [] };
    const [, name, id, operation] = match;
    const [stateKey, storageKey, prefix] = adminCollections[name];
    const list = state[stateKey] || [];
    if (!id && method === 'GET') return { items: list };
    if (!id && method === 'POST') {
      const initials = String(body.name || '').split(/\s+/).slice(0,2).map((part) => part[0]).join('').toUpperCase();
      return { item: { ...body, ...(initials && !body.initials ? { initials } : {}), id: `${prefix}-${Date.now()}`, createdAt: new Date().toISOString() } };
    }
    const current = [...list, ...initialDoubts].find((item) => item.id === id);
    if (!current) throw new Error('Record not found.');
    if (operation && method === 'POST') return { item: { ...current, status: operation === 'resolve' ? 'Answered' : 'Assigned', ...(operation === 'assign' ? { assignedTo: 'Subject faculty' } : {}) } };
    if (method === 'PATCH') return { item: { ...current, ...body, id } };
    throw new Error('Method not supported in offline demo.');
  }
  if (pathname.startsWith('/api/student/')) {
    const user = readUser();
    if (!user) throw new Error('Please sign in to continue.');
    if (user.role !== 'student') throw new Error('This workspace is not available for your account.');
    if (pathname === '/api/student/doubts' && method === 'GET') return { items: state.customDoubts || [] };
    if (pathname === '/api/student/doubts' && method === 'POST') {
      const item = { ...body, id: `d-${Date.now()}`, studentPhone: user.phone, studentName: user.name, status: 'In review', time: 'Just now', createdAt: new Date().toISOString() };
      return { item };
    }
    if (pathname === '/api/student/community' && method === 'GET') return { items: state.customPosts || [] };
    if (pathname === '/api/student/community' && method === 'POST') {
      const text = String(body.text || '').trim();
      const item = { id: `post-${Date.now()}`, name: user.name, initials: user.initials, time: 'Just now', subject: body.subject || 'JEE 2027', title: text.length > 86 ? `${text.slice(0,83)}…` : text, text, votes: 0, replies: 0, verified: false };
      return { item };
    }
  }
  throw new Error('This feature needs the online Dream Classes server.');
}

async function apiRequest(url, options = {}) {
  const isOfflineDemo = Boolean(window.DREAM_CLASSES_OFFLINE_DEMO) || (typeof location !== 'undefined' && location.protocol === 'file:');
  if (isOfflineDemo) return offlineApiRequest(url, options);
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
    body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
  });
  let data = {};
  try { data = await response.json(); } catch { /* Non-JSON error response. */ }
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

async function hydrateWorkspace() {
  if (!state.sessionUser) return;
  if (state.sessionUser.role === 'admin') {
    const [students, faculty, batches, classes, tests, content, doubts, notifications] = await Promise.all([
      apiRequest('/api/admin/students'), apiRequest('/api/admin/faculty'), apiRequest('/api/admin/batches'),
      apiRequest('/api/admin/classes'), apiRequest('/api/admin/tests'), apiRequest('/api/admin/content'),
      apiRequest('/api/admin/doubts'), apiRequest('/api/admin/notifications'),
    ]);
    state.adminStudents = students.items;
    state.adminFaculty = faculty.items;
    state.adminBatches = batches.items;
    state.adminScheduledClasses = classes.items;
    state.adminTests = tests.items;
    state.adminContent = content.items;
    state.customDoubts = doubts.items;
    state.adminNotifications = notifications.items;
    state.assignedDoubts = new Set(doubts.items.filter((item) => item.status === 'Assigned').map((item) => item.id));
    state.resolvedDoubts = new Set(doubts.items.filter((item) => item.status === 'Answered').map((item) => item.id));
  } else {
    const [doubts, posts] = await Promise.all([apiRequest('/api/student/doubts'), apiRequest('/api/student/community')]);
    state.customDoubts = doubts.items;
    state.customPosts = posts.items;
  }
}

function renderSplash() {
  return `<main class="auth-loading"><span class="brand-mark">${icon('spark')}</span><strong>Dream Classes</strong><span>Loading your learning space…</span></main>`;
}

function renderLogin() {
  const otpStep = state.loginStep === 'otp';
  return `<main class="auth-page">
    <section class="auth-story">
      <a class="brand-lockup auth-brand" href="#" data-action="noop"><span class="brand-mark">${icon('spark')}</span><span><span class="brand-name">Dream Classes</span><span class="brand-tagline">Learn with purpose</span></span></a>
      <div class="auth-story-copy"><span class="eyebrow">A LITTLE PROGRESS, EVERY DAY</span><h1>Your next big idea is waiting.</h1><p>A welcoming place to learn, practise and keep moving toward the future you want.</p><div class="auth-benefit-list"><div>${icon('video')}<span><strong>Learn live with great teachers</strong><small>Ask questions and stay on track.</small></span></div><div>${icon('target')}<span><strong>Practise with purpose</strong><small>Short daily sets, useful feedback.</small></span></div><div>${icon('chart')}<span><strong>See how far you’ve come</strong><small>Progress that feels motivating.</small></span></div></div></div>
      <div class="auth-story-foot"><span>Made for curious minds across India.</span><span>Dream Classes · 2026</span></div>
    </section>
    <section class="auth-side"><div class="auth-form-wrap"><div class="auth-card"><span class="tag">STUDENT & ADMIN ACCESS</span><h2>${otpStep ? 'Check your messages.' : 'Welcome to your classroom.'}</h2><p>${otpStep ? `Enter the one-time code for +91 ${escapeHTML(state.loginPhone)}.` : 'Sign in with your mobile number to continue learning.'}</p>
      <div class="auth-role-switch" role="tablist" aria-label="Choose account type"><button class="${state.loginRole === 'student' ? 'selected' : ''}" data-action="login-role" data-role="student" role="tab" aria-selected="${state.loginRole === 'student'}">${icon('bookOpen')} Student</button><button class="${state.loginRole === 'admin' ? 'selected' : ''}" data-action="login-role" data-role="admin" role="tab" aria-selected="${state.loginRole === 'admin'}">${icon('settings')} Admin</button></div>
      ${state.loginError ? `<div class="auth-error">${icon('help')}${escapeHTML(state.loginError)}</div>` : ''}
      ${otpStep ? `<form data-form="login-otp" class="auth-form"><div class="form-field"><label for="login-otp">One-time password</label><input id="login-otp" name="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="Enter 6-digit code" value="${escapeHTML(state.loginOtp)}" required autofocus /></div>${state.demoOtp ? `<div class="auth-demo-code"><span>${icon('lock')} Development demo · no SMS is sent</span><strong>Demo OTP: ${escapeHTML(state.demoOtp)}</strong><button type="button" data-action="copy-demo-otp">Copy code</button></div>` : ''}<button class="btn btn-primary btn-full" type="submit" ${state.loginBusy ? 'disabled' : ''}>${state.loginBusy ? 'Verifying…' : 'Verify & continue'} ${icon('arrowRight')}</button><button type="button" class="auth-back" data-action="back-to-phone">${icon('arrowRight')} Change mobile number</button></form>` : `<form data-form="login-phone" class="auth-form"><div class="form-field"><label for="login-phone">Mobile number</label><div class="auth-phone-input"><span>+91</span><input id="login-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" placeholder="Enter your 10-digit number" value="${escapeHTML(state.loginPhone)}" required /></div></div><button class="btn btn-primary btn-full" type="submit" ${state.loginBusy ? 'disabled' : ''}>${state.loginBusy ? 'Sending code…' : 'Continue with mobile'} ${icon('arrowRight')}</button><div class="auth-divider"><span>or continue with</span></div><button type="button" class="auth-google" data-action="google-login-info"><b>G</b> Google sign-in</button></form>`}
      <div class="auth-safety-note">${icon('lock')} Demo only · Use a test number; no SMS is sent. Admin selection is not production permission control.</div>
    </div><p class="auth-footnote">By continuing, you agree to Dream Classes’ <button data-action="show-toast" data-message="Terms of use are being prepared.">Terms</button> and <button data-action="show-toast" data-message="Privacy details are being prepared.">Privacy Policy</button>.</p></div></section>
  </main>`;
}

const navGroups = [
  { title: 'Learn', links: [
    ['overview', 'Overview', 'grid'], ['courses', 'My courses', 'book'], ['live', 'Live classes', 'video', '2'], ['practice', 'Practice & tests', 'target'], ['materials', 'Study material', 'file'],
  ] },
  { title: 'Your space', links: [
    ['doubts', 'Doubt solving', 'message'], ['community', 'Community', 'users'], ['progress', 'My progress', 'chart'],
  ] },
  { title: 'Account', links: [['settings', 'Settings', 'settings']] },
];

const adminNavGroups = [
  { title: 'Manage', links: [
    ['admin-overview', 'Overview', 'grid'], ['admin-students', 'Students', 'users'], ['admin-faculty', 'Faculty', 'usersRound'], ['admin-batches', 'Batches & courses', 'book'],
  ] },
  { title: 'Operate', links: [
    ['admin-content', 'Content library', 'file'], ['admin-live', 'Live classes', 'video'], ['admin-tests', 'Test management', 'target'], ['admin-doubts', 'Doubt queue', 'message', '8'],
  ] },
  { title: 'Insights', links: [
    ['admin-notifications', 'Notifications', 'bell'], ['admin-analytics', 'Analytics', 'chart'], ['admin-settings', 'Settings', 'settings'],
  ] },
];

const pageMeta = {
  'admin-overview': ['Admin overview', 'A clear view of your learning community and today’s operations.'],
  'admin-students': ['Student management', 'Support every learner with a clear view of their courses and activity.'],
  'admin-faculty': ['Faculty management', 'Manage your teachers, subjects and teaching assignments.'],
  'admin-batches': ['Batches & courses', 'Create learning journeys and keep every batch organised.'],
  'admin-content': ['Content library', 'Publish lessons, notes and practice material to the right learners.'],
  'admin-live': ['Live class management', 'Schedule teaching sessions and keep your learners in the loop.'],
  'admin-tests': ['Test management', 'Build assessments, set a schedule and publish results.'],
  'admin-doubts': ['Doubt queue', 'Route learner questions to the right faculty and follow them through.'],
  'admin-notifications': ['Notifications', 'Send a helpful update to the right students at the right time.'],
  'admin-payments': ['Payments & revenue', 'Review purchases, refunds and the health of your business.'],
  'admin-analytics': ['Learning analytics', 'Understand engagement, retention and academic progress.'],
  'admin-settings': ['Platform settings', 'Manage key details for your Dream Classes workspace.'],
  overview: ['Good morning, Aarav 👋', 'You’re showing up for your goals — keep that momentum going.'],
  courses: ['Your learning library', 'Everything you need for your Class 11 JEE journey, in one place.'],
  live: ['Live classes', 'Join your classroom, catch a replay or get ready for what’s next.'],
  practice: ['Practice makes progress', 'Small, regular practice is how big results are made.'],
  materials: ['Study material', 'Your notes, formula sheets and practice sets — ready whenever you are.'],
  doubts: ['Ask without hesitation', 'Every great learner asks questions. Our faculty is here to help.'],
  community: ['Learn better, together', 'Share a thought, ask your peers and celebrate each other’s wins.'],
  progress: ['Your progress, at a glance', 'Every focused hour is bringing you closer to your goal.'],
  settings: ['Your preferences', 'Make your Dream Classes experience feel like yours.'],
};

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function currentDateLabel() {
  return new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date());
}

function renderNav() {
  const groups = state.role === 'admin' ? adminNavGroups : navGroups;
  return groups.map((group) => `
    <div class="nav-group">
      <p class="nav-heading">${group.title}</p>
      ${group.links.map(([view, label, glyph, badge]) => `
        <button class="nav-link ${state.view === view ? 'active' : ''}" data-action="navigate" data-view="${view}" ${state.view === view ? 'aria-current="page"' : ''}>
          ${icon(glyph)}<span>${label}</span>${badge ? `<span class="nav-badge">${badge}</span>` : ''}
        </button>`).join('')}
    </div>`).join('');
}

function renderProfilePopover() {
  if (state.popover !== 'profile') return '';
  const settingsView = state.role === 'admin' ? 'admin-settings' : 'settings';
  const targetRole = state.role === 'admin' ? 'student' : 'admin';
  return `<div class="popover profile-popover">
    <div class="popover-heading">${state.role === 'admin' ? 'Admin workspace' : 'Your account'}</div>
    <button class="popover-row" data-action="navigate" data-view="${settingsView}">${icon('settings')}<span><strong>${state.role === 'admin' ? 'Workspace settings' : 'Profile & settings'}</strong><small>${state.role === 'admin' ? 'Manage your platform' : 'Personalise your learning'}</small></span></button>
    <button class="popover-row" data-action="switch-role" data-role="${targetRole}">${icon('layers')}<span><strong>Sign in as ${targetRole === 'admin' ? 'Admin' : 'Student'}</strong><small>Continue with a one-time mobile code</small></span></button>
    <button class="popover-row" data-action="logout">${icon('logout')}<span><strong>Sign out</strong><small>End this session securely</small></span></button>
  </div>`;
}

function renderSidebar() {
  const admin = state.role === 'admin';
  const profileName = state.sessionUser?.name || (admin ? 'Ronny Raj' : 'Aarav Sharma');
  const profileInitials = state.sessionUser?.initials || (admin ? 'RR' : 'AS');
  const profileCaption = state.sessionUser?.className || (admin ? 'Super Admin' : 'Class 11 · JEE aspirant');
  return `<div class="mobile-overlay ${state.mobileOpen ? 'open' : ''}" data-action="close-mobile" aria-hidden="true"></div>
    <aside class="sidebar ${state.mobileOpen ? 'open' : ''}" aria-label="Main navigation">
      <a href="#" class="brand-lockup" data-action="navigate" data-view="${admin ? 'admin-overview' : 'overview'}" aria-label="Dream Classes home">
        <span class="brand-mark">${icon('spark')}</span>
        <span><span class="brand-name">Dream Classes</span><span class="brand-tagline">Learn with purpose</span></span>
      </a>
      <div class="sidebar-context">
        <span class="context-icon">${icon(admin ? 'settings' : 'bookOpen')}</span>
        <span class="context-copy"><strong>${admin ? 'Admin workspace' : 'Student space'}</strong><span>${admin ? 'Super Admin · Dream Classes' : 'Class 11 · JEE'}</span></span>
        ${icon('chevronDown', 'context-chevron')}
      </div>
      <nav class="sidebar-nav">${renderNav()}</nav>
      <div class="sidebar-bottom">
        ${admin ? `<div class="admin-side-note"><span class="quick-icon violet">${icon('lock')}</span><span><strong>Admin access</strong><small>Super Admin workspace</small></span></div>` : `<div class="streak-card">
          <div class="streak-top"><span class="streak-flame">${icon('flame')}</span><strong>Your study streak</strong><span>5 days</span></div>
          <div class="streak-caption">One small step, every day.</div>
          <div class="streak-days">${['M','T','W','T','F','S','S'].map((d, i) => `<span class="streak-day ${i < 5 ? 'done' : ''} ${i === 4 ? 'today' : ''}"><i>${i < 4 ? icon('check') : i === 4 ? '•' : ''}</i>${d}</span>`).join('')}</div>
        </div>`}
        <div class="profile-wrap">
          <button class="profile-switch" data-action="toggle-profile" aria-expanded="${state.popover === 'profile'}">
            <span class="avatar ${admin ? 'avatar-violet' : ''}">${escapeHTML(profileInitials)}</span><span class="profile-meta"><strong>${escapeHTML(profileName)}</strong><span>${escapeHTML(profileCaption)}</span></span>${icon('more')}
          </button>
          ${renderProfilePopover()}
        </div>
      </div>
    </aside>`;
}

function renderLanguagePopover() {
  if (state.popover !== 'language') return '';
  return `<div class="popover"><div class="popover-heading">Display language</div>
    <button class="popover-row" data-action="set-language" data-language="EN">${icon(state.language === 'EN' ? 'checkCircle' : 'book')}<span><strong>English</strong><small>Student dashboard language</small></span></button>
    <button class="popover-row" data-action="set-language" data-language="HI">${icon(state.language === 'HI' ? 'checkCircle' : 'book')}<span><strong>हिन्दी</strong><small>हिन्दी में सीखें</small></span></button>
  </div>`;
}

function renderNotificationPopover() {
  if (state.popover !== 'notifications') return '';
  if (state.role === 'admin') return `<div class="popover">
    <div class="popover-heading">Admin alerts</div>
    <button class="popover-row" data-action="navigate" data-view="admin-doubts">${icon('message')}<span><strong>8 doubts need a faculty</strong><small>Review the pending doubt queue</small></span></button>
    <button class="popover-row" data-action="navigate" data-view="admin-live">${icon('calendar')}<span><strong>Classes scheduled this week</strong><small>Review faculty and batch assignments</small></span></button>
    <div class="popover-divider"></div>
    <button class="text-link" style="padding:7px 9px" data-action="mark-read">${state.notificationsRead ? 'All caught up' : 'Mark all as read'} ${icon('check')}</button>
  </div>`;
  return `<div class="popover">
    <div class="popover-heading">Notifications</div>
    <button class="popover-row" data-action="navigate" data-view="live">${icon('video')}<span><strong>Physics class today</strong><small>Rotational Motion · 11:30 AM</small></span></button>
    <button class="popover-row" data-action="navigate" data-view="materials">${icon('file')}<span><strong>New notes are here</strong><small>Newton’s Laws formula sheet</small></span></button>
    <div class="popover-divider"></div>
    <button class="text-link" style="padding:7px 9px" data-action="mark-read">${state.notificationsRead ? 'All caught up' : 'Mark all as read'} ${icon('check')}</button>
  </div>`;
}

function renderSearchItems() {
  const text = state.query.trim().toLowerCase();
  if (!text) return '';
  const sourceItems = state.role === 'admin' ? [
    ...state.adminStudents.map((item) => ({ label: item.name, detail: `${item.grade} · ${item.batch}`, view: 'admin-students', action: 'navigate', icon: 'users' })),
    ...state.adminBatches.map((item) => ({ label: item.name, detail: `${item.grade} · ${item.students} students`, view: 'admin-batches', action: 'navigate', icon: 'book' })),
    { label: 'Pending doubts', detail: 'Review student questions', view: 'admin-doubts', action: 'navigate', icon: 'message' },
    { label: 'Content library', detail: 'Manage lessons and study files', view: 'admin-content', action: 'navigate', icon: 'file' },
  ] : [
    ...courseData.map((item) => ({ label: item.title, detail: `${item.subject} · ${item.exam}`, view: 'courses', action: 'open-course', id: item.id, icon: 'book' })),
    ...materialData.map((item) => ({ label: item.title, detail: `${item.subject} · ${item.type}`, view: 'materials', action: 'search-material', id: item.id, icon: 'file' })),
    { label: 'Upcoming live classes', detail: 'See your class schedule', view: 'live', action: 'navigate', icon: 'video' },
    { label: 'Daily practice problems', detail: 'Try today’s DPP', view: 'practice', action: 'navigate', icon: 'target' },
  ];
  const items = sourceItems.filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(text)).slice(0, 5);
  if (!items.length) return `<div class="search-empty">No lessons or materials found for “${escapeHTML(state.query)}”</div>`;
  return `<div class="search-results-label">Quick results</div>${items.map((item) => `<button class="search-result" data-action="${item.action}" ${item.view ? `data-view="${item.view}"` : ''} ${item.id ? `data-id="${item.id}"` : ''}>${icon(item.icon)}<span>${escapeHTML(item.label)}<small style="display:block;margin-top:3px;color:#9ba3b1;font-size:8px">${escapeHTML(item.detail)}</small></span></button>`).join('')}`;
}

function renderTopbar() {
  const viewName = (pageMeta[state.view] || pageMeta.overview)[0].replace(' 👋', '');
  return `<header class="topbar">
    <div class="topbar-left">
      <button class="mobile-menu-button" data-action="toggle-mobile" aria-label="Open navigation">${icon('menu')}</button>
      <div class="topbar-context"><strong>Dream Classes</strong><span> / ${escapeHTML(viewName)}</span></div>
    </div>
    <div class="topbar-right">
      <div class="search-wrap">
        <label class="search-field">${icon('search')}<input id="global-search" type="search" autocomplete="off" value="${escapeHTML(state.query)}" placeholder="Search lessons, notes..." aria-label="Search lessons and notes" /><span class="search-shortcut">⌘ K</span></label>
        <div class="search-results ${state.searchOpen && state.query.trim() ? 'open' : ''}" id="search-results">${renderSearchItems()}</div>
      </div>
      <div class="header-action-wrap">
        <button class="language-button" data-action="toggle-popover" data-popover="language" aria-label="Choose language" aria-expanded="${state.popover === 'language'}">${icon('book')}<span>${state.language === 'HI' ? 'HI' : 'EN'}</span>${icon('chevronDown')}</button>
        ${renderLanguagePopover()}
      </div>
      <div class="header-action-wrap">
        <button class="header-icon-button" data-action="toggle-popover" data-popover="notifications" aria-label="Notifications" aria-expanded="${state.popover === 'notifications'}">${icon('bell')}${state.notificationsRead ? '' : '<i class="notification-dot"></i>'}</button>
        ${renderNotificationPopover()}
      </div>
    </div>
  </header>`;
}

function renderIntro() {
  const [title, subtitle] = pageMeta[state.view] || pageMeta.overview;
  const dateChip = ['overview','live','progress','admin-overview','admin-live','admin-analytics'].includes(state.view)
    ? `<div class="page-intro-side"><span class="date-chip">${icon('calendar')}${currentDateLabel()}</span></div>` : '';
  return `<div class="page-intro"><div><h1>${title}</h1><p>${subtitle}</p></div>${dateChip}</div>`;
}

function renderOverview() {
  return `${renderIntro()}
    <section class="hero-grid" aria-label="Your day at a glance">
      <div class="welcome-card">
        <div class="welcome-content">
          <span class="eyebrow">${icon('spark')} YOUR NEXT BIG IDEA STARTS HERE</span>
          <h2>One lesson closer to your dream.</h2>
          <p>You’re building great momentum, Aarav. Pick up right where you left off and keep your 5-day streak alive.</p>
          <div class="welcome-actions">
            <button class="btn btn-white" data-action="continue-course" data-id="laws-motion">Continue learning ${icon('arrowRight')}</button>
            <button class="btn btn-glass" data-action="navigate" data-view="practice">Try today’s DPP</button>
          </div>
        </div>
      </div>
      <article class="next-class-card">
        <div class="card-overline"><span>Up next · Today</span><span class="live-label">LIVE AT 11:30 AM</span></div>
        <div class="class-card-main">
          <span class="subject-tile">${icon('atom')}</span>
          <div class="class-details"><span class="subject-label">PHYSICS · JEE CLASS 11</span><h3>Rotational Motion: Part 2</h3><div class="teacher-line"><span class="avatar">RS</span>Dr. Rohan Sen <span style="color:#c3c8d2">·</span> 60 min</div></div>
        </div>
        <div class="class-bottom"><span class="class-meta">${icon('clock')}Today · 11:30 AM IST</span><button class="btn btn-primary btn-compact" data-action="join-live" data-id="rotational">Join class ${icon('arrowRight')}</button></div>
      </article>
    </section>
    <section class="stats-grid" aria-label="Learning statistics">
      <article class="stat-card"><span class="stat-icon amber">${icon('flame')}</span><div class="stat-copy"><span class="stat-label">Study streak</span><span class="stat-value">5 <small>days in a row</small></span></div><span class="stat-trend">Keep it up!</span></article>
      <article class="stat-card"><span class="stat-icon mint">${icon('clock')}</span><div class="stat-copy"><span class="stat-label">Study time this week</span><span class="stat-value">18.5 <small>hours</small></span></div><div class="mini-bars" aria-hidden="true">${[12,19,14,27,20,30,24].map((height) => `<i style="height:${height}px"></i>`).join('')}</div></article>
      <article class="stat-card"><span class="stat-icon violet">${icon('trending')}</span><div class="stat-copy"><span class="stat-label">Average test score</span><span class="stat-value">84<small>% this month</small></span></div><span class="stat-trend">${icon('trending')} +6%</span></article>
    </section>
    <section class="content-grid">
      <article class="panel panel-pad">
        <div class="panel-header"><div class="panel-title-wrap"><h2>Continue where you left off</h2><p>Your learning journey, one step at a time.</p></div><button class="text-link" data-action="navigate" data-view="courses">All courses ${icon('arrowRight')}</button></div>
        <div class="continue-card">
          <div class="course-art art-physics"><span class="art-label">PHYSICS · JEE</span><span class="art-formula">F = ma</span><span class="art-note">NEWTON’S LAWS</span></div>
          <div class="continue-details">
            <div class="course-meta-row"><span>CLASS 11</span><i class="dot"></i><span>24 LESSONS</span></div>
            <h3>Laws of Motion</h3><p>with Dr. Rohan Sen</p>
            <div class="progress-line-wrap"><div class="progress-meta"><span>Course progress</span><strong>68% complete</strong></div><div class="progress-track"><div class="progress-fill" style="width:68%"></div></div></div>
            <div class="continue-footer"><span class="lesson-next">Next up: <strong>Rotational Motion · L09</strong></span><button class="btn btn-soft btn-compact" data-action="continue-course" data-id="laws-motion">Resume ${icon('play')}</button></div>
          </div>
        </div>
      </article>
      <div class="dashboard-side">
        <article class="panel panel-pad">
          <div class="panel-header"><div class="panel-title-wrap"><h3>Today’s schedule</h3><p>Make a little space to learn.</p></div><button class="text-link" data-action="navigate" data-view="live">Full schedule ${icon('arrowRight')}</button></div>
          <div class="schedule-list">
            <div class="schedule-item"><span class="schedule-dot"></span><div class="schedule-info"><span class="schedule-time">11:30 AM · 60 min</span><h4>Rotational Motion: Part 2</h4><p>Dr. Rohan Sen</p></div><span class="schedule-subject">PHY</span></div>
            <div class="schedule-item"><span class="schedule-dot muted"></span><div class="schedule-info"><span class="schedule-time">3:00 PM · 60 min</span><h4>Hybridisation & Molecular Shapes</h4><p>Aditi Kapoor</p></div><span class="schedule-subject" style="color:#b07c48;background:#fff4e8">CHEM</span></div>
          </div>
        </article>
        <article class="panel panel-pad" style="padding:14px 16px">
          <div class="panel-header" style="margin-bottom:10px"><div class="panel-title-wrap"><h3>Today’s focus</h3></div><span class="tag green">ON TRACK</span></div>
          <div style="display:flex;align-items:center;gap:9px"><span class="quick-icon orange" style="width:31px;height:31px">${icon('target')}</span><div class="quick-text"><strong>Finish your daily DPP</strong><span>10 questions · around 15 min</span></div><button class="icon-button" data-action="start-dpp" aria-label="Start daily DPP">${icon('arrowRight')}</button></div>
        </article>
      </div>
    </section>
    <section class="quick-row" aria-label="Quick actions">
      <button class="quick-card" data-action="navigate" data-view="practice"><span class="quick-icon orange">${icon('target')}</span><span class="quick-text"><strong>Daily practice</strong><span>Sharpen today’s concepts</span></span>${icon('chevronRight')}</button>
      <button class="quick-card" data-action="navigate" data-view="materials"><span class="quick-icon teal">${icon('file')}</span><span class="quick-text"><strong>Study resources</strong><span>Notes, DPPs and PYQs</span></span>${icon('chevronRight')}</button>
      <button class="quick-card" data-action="navigate" data-view="doubts"><span class="quick-icon">${icon('message')}</span><span class="quick-text"><strong>Ask a doubt</strong><span>Get help from your faculty</span></span>${icon('chevronRight')}</button>
    </section>`;
}

function courseMatchesFilter(course) {
  if (state.courseFilter === 'My courses' && !course.enrolled) return false;
  if (state.courseFilter === 'JEE' && course.exam !== 'JEE') return false;
  if (state.courseFilter === 'Class 11' && !course.grade.includes('11')) return false;
  if (state.courseFilter === 'All courses') return true;
  return true;
}

function renderCourseCard(course) {
  const price = course.price === 0 ? 'Included' : `₹${course.price.toLocaleString('en-IN')}`;
  return `<article class="catalog-card">
    <div class="catalog-art ${course.art}"><span class="art-label">${escapeHTML(course.subject.toUpperCase())}</span><span class="course-pill">${course.enrolled ? 'YOUR COURSE' : 'ENROL NOW'}</span><span class="art-formula">${escapeHTML(course.symbol)}</span></div>
    <div class="catalog-body">
      <div class="catalog-tags"><span class="tag">${escapeHTML(course.exam)}</span><span class="tag gray">${escapeHTML(course.grade)}</span>${course.enrolled ? '<span class="tag green">Enrolled</span>' : ''}</div>
      <h3>${escapeHTML(course.title)}</h3><p>${escapeHTML(course.description)}</p>
      <div class="catalog-meta"><span>${icon('video')}${course.lessons} lessons</span><span>${icon('clock')}${escapeHTML(course.duration)}</span><span>${icon('usersRound')}${escapeHTML(course.teacher)}</span></div>
      <div class="catalog-footer"><span class="catalog-price">${price}${course.price ? '<small> · one-time</small>' : ''}</span><button class="btn ${course.enrolled ? 'btn-soft' : 'btn-primary'} btn-compact" data-action="open-course" data-id="${course.id}">${course.enrolled ? 'Open course' : 'Explore batch'} ${icon('arrowRight')}</button></div>
    </div>
  </article>`;
}

function renderCourses() {
  const filters = ['All courses', 'My courses', 'JEE', 'Class 11'];
  const matching = courseData.filter(courseMatchesFilter);
  return `${renderIntro()}
    <section class="page-banner"><div class="page-banner-copy"><span class="eyebrow">${icon('spark')} BUILT AROUND YOUR GOAL</span><h2>Learn at your pace. Aim higher.</h2><p>Live teaching, structured courses and plenty of practice — all working together for your JEE journey.</p></div><div class="banner-visual"><div class="banner-visual-stat"><strong>3</strong><span>courses in progress</span></div><i class="banner-divider"></i><div class="banner-visual-stat"><strong>68%</strong><span>best chapter progress</span></div></div></section>
    <div class="filter-row"><span class="filter-label">Show:</span>${filters.map((filter) => `<button class="filter-chip ${state.courseFilter === filter ? 'selected' : ''}" data-action="course-filter" data-filter="${escapeHTML(filter)}">${escapeHTML(filter)}</button>`).join('')}</div>
    <section class="courses-grid" aria-label="Available courses">${matching.length ? matching.map(renderCourseCard).join('') : '<div class="empty-state">No courses match this filter yet.</div>'}</section>`;
}

function renderLiveClasses() {
  return `${renderIntro()}
    <section class="page-banner"><div class="page-banner-copy"><span class="eyebrow">${icon('video')} YOUR CLASSROOM IS READY</span><h2>Show up curious. Leave a little wiser.</h2><p>Join live sessions with your teachers, ask questions in real time and revisit the recordings whenever you need a refresher.</p></div><div class="banner-visual"><div class="banner-visual-stat"><strong>02</strong><span>classes today</span></div><i class="banner-divider"></i><div class="banner-visual-stat"><strong>04</strong><span>upcoming this week</span></div></div></section>
    <div class="panel-header" style="margin:20px 2px 12px"><div class="panel-title-wrap"><h2 style="font-size:14px">Your class schedule</h2><p>All times shown in IST · India Standard Time</p></div><button class="btn btn-outline btn-compact" data-action="show-toast" data-message="Your calendar is up to date.">${icon('calendar')} Sync calendar</button></div>
    <section class="class-schedule">${liveClasses.map((item, index) => `<article class="class-row"><div class="class-date-box"><strong>${escapeHTML(item.day)}</strong><span>${escapeHTML(item.month)}</span></div><div class="class-row-main"><span class="tag ${item.subject === 'Chemistry' ? 'orange' : item.subject === 'Mathematics' ? 'green' : ''}">${escapeHTML(item.subject)}</span><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.time)} <span>·</span> 60 minutes <span>·</span> ${escapeHTML(item.status)}</p></div><div class="class-row-action"><div class="teacher-line"><span class="avatar ${item.color}">${escapeHTML(item.initials)}</span>${escapeHTML(item.teacher)}</div><button class="btn ${index === 0 ? 'btn-primary' : 'btn-outline'} btn-compact" data-action="${index === 0 ? 'join-live' : 'set-reminder'}" data-id="${item.id}">${index === 0 ? `${icon('video')} Join class` : `${icon('bell')} Remind me`}</button></div></article>`).join('')}</section>
    <div class="panel" style="display:flex;align-items:center;gap:12px;padding:13px 15px;margin-top:13px"><span class="quick-icon teal">${icon('refresh')}</span><div class="quick-text"><strong>Missed a class?</strong><span>Recordings are usually available in your course library within 24 hours.</span></div><button class="text-link" data-action="navigate" data-view="courses">Browse courses ${icon('arrowRight')}</button></div>`;
}

function renderPractice() {
  const tests = [
    { title: 'Laws of Motion · Chapter Test', type: 'CHAPTER TEST', subject: 'Physics', questions: '20 questions', time: '30 min', status: 'Ready to start', tone: '' },
    { title: 'Chemical Bonding · Unit Test', type: 'UNIT TEST', subject: 'Chemistry', questions: '25 questions', time: '40 min', status: 'Ready to start', tone: 'orange' },
    { title: 'JEE Main · Mini Mock 03', type: 'MOCK TEST', subject: 'JEE Main', questions: '30 questions', time: '45 min', status: 'Available', tone: 'green' },
  ];
  return `${renderIntro()}
    <div class="practice-grid">
      <div>
        <section class="dpp-card"><span class="eyebrow">${icon('target')} DAILY PRACTICE PROBLEMS · 22 OCT</span><h2>Ready for a 15-minute brain boost?</h2><p>Today’s set revisits Newton’s laws and momentum. Give it a try — every attempt helps you learn something new.</p><div class="dpp-stats"><span class="dpp-stat">${icon('list')} 10 questions</span><span class="dpp-stat">${icon('clock')} ~15 minutes</span><span class="dpp-stat">${icon('award')} Earn 50 XP</span></div><button class="btn btn-white" data-action="start-dpp">Start today’s DPP ${icon('arrowRight')}</button></section>
        <article class="panel panel-pad" style="margin-top:14px"><div class="panel-header"><div class="panel-title-wrap"><h2>Recent attempts</h2><p>Look how far you’ve come.</p></div><button class="text-link" data-action="navigate" data-view="progress">See analytics ${icon('arrowRight')}</button></div>
          <div class="schedule-list"><div class="schedule-item"><span class="schedule-dot"></span><div class="schedule-info"><span class="schedule-time">Yesterday · Physics DPP</span><h4>Work, Energy & Power</h4><p>8 / 10 correct · 80% accuracy</p></div><span class="tag green">80%</span></div><div class="schedule-item"><span class="schedule-dot muted"></span><div class="schedule-info"><span class="schedule-time">20 Oct · Maths test</span><h4>Sequences & Series</h4><p>17 / 20 correct · 85% accuracy</p></div><span class="tag green">85%</span></div></div>
        </article>
      </div>
      <section><div class="panel-header" style="margin:2px 1px 11px"><div class="panel-title-wrap"><h2 style="font-size:13px">More to practise</h2><p>Tests picked for your courses.</p></div><button class="icon-button" data-action="show-toast" data-message="Showing tests for your Class 11 JEE plan." aria-label="Filter tests">${icon('filter')}</button></div><div class="practice-test-list">${tests.map((test, i) => `<article class="test-card"><div class="test-card-top"><span class="tag ${test.tone}">${test.type}</span>${i === 0 ? '<span class="status-pill">New</span>' : ''}</div><h3>${test.title}</h3><p>${test.subject} · ${test.status}</p><div class="test-card-meta"><span>${icon('list')}${test.questions}</span><span>${icon('clock')}${test.time}</span></div><button class="btn btn-outline btn-compact btn-full" data-action="start-dpp" data-test="${escapeHTML(test.title)}">View test details ${icon('arrowRight')}</button></article>`).join('')}</div></section>
    </div>`;
}

function materialMatchesFilter(item) {
  if (state.materialFilter !== 'All materials' && item.category !== state.materialFilter) return false;
  const term = state.materialQuery.trim().toLowerCase();
  if (term && !`${item.title} ${item.subject} ${item.category}`.toLowerCase().includes(term)) return false;
  return true;
}

function renderMaterialRow(item) {
  const saved = state.savedMaterials.has(item.id);
  const downloaded = state.downloadedMaterials.has(item.id);
  return `<article class="material-row"><span class="file-icon ${item.tone}">${icon('file')}</span><div class="material-copy"><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.subject)} <span>·</span> ${escapeHTML(item.category)} <span>·</span> ${escapeHTML(item.meta)} <span>·</span> ${escapeHTML(item.date)}</p></div><div class="material-actions"><button class="icon-button ${saved ? 'saved' : ''}" data-action="toggle-bookmark" data-id="${item.id}" aria-label="${saved ? 'Remove bookmark' : 'Bookmark'} ${escapeHTML(item.title)}">${icon('bookmark')}</button><button class="icon-button ${downloaded ? 'saved' : ''}" data-action="download-material" data-id="${item.id}" aria-label="${downloaded ? 'Saved offline' : 'Download'} ${escapeHTML(item.title)}">${icon(downloaded ? 'check' : 'download')}</button><button class="btn btn-soft btn-compact" data-action="view-material" data-id="${item.id}">Open ${icon('arrowRight')}</button></div></article>`;
}

function renderMaterials() {
  const categories = ['All materials', 'Class notes', 'Formula sheets', 'Revision notes', 'NCERT solutions', 'PYQ', 'DPP'];
  const filtered = materialData.filter(materialMatchesFilter);
  return `${renderIntro()}
    <section class="page-banner"><div class="page-banner-copy"><span class="eyebrow">${icon('bookOpen')} YOUR STUDY DESK</span><h2>Good notes make great revision.</h2><p>Class notes, PYQs, quick revision sheets and practice sets from your teachers — all together.</p></div><div class="banner-visual"><div class="banner-visual-stat"><strong>${materialData.length}</strong><span>fresh resources</span></div><i class="banner-divider"></i><div class="banner-visual-stat"><strong>PDF</strong><span>ready to read</span></div></div></section>
    <div class="material-toolbar"><div class="material-categories">${categories.map((category) => `<button class="filter-chip ${state.materialFilter === category ? 'selected' : ''}" data-action="material-filter" data-filter="${escapeHTML(category)}">${escapeHTML(category)}</button>`).join('')}</div><label class="material-search">${icon('search')}<input id="material-search" type="search" value="${escapeHTML(state.materialQuery)}" placeholder="Find a resource..." aria-label="Search study material" /></label></div>
    <section class="material-list">${filtered.length ? filtered.map(renderMaterialRow).join('') : '<div class="empty-state">No resources match your search.</div>'}</section>
    <div style="display:flex;align-items:center;gap:9px;margin-top:14px;color:#939cad;font-size:9px">${icon('lock')} All course resources are available to enrolled Dream Classes students.</div>`;
}

function renderDoubtItem(item) {
  return `<article class="doubt-item"><div class="doubt-item-top"><span class="tag ${item.subject === 'Chemistry' ? 'orange' : item.subject === 'Mathematics' ? '' : 'green'}">${escapeHTML(item.subject)}</span><span class="status-pill ${item.status === 'Answered' ? 'answered' : ''}">${escapeHTML(item.status)}</span></div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.body)}</p>${item.answer ? `<div style="margin-top:10px;padding:9px 10px;border-radius:9px;color:#667086;background:#f7f8fc;font-size:8px;line-height:1.6"><strong style="color:#5d59cf">Faculty answer:</strong> ${escapeHTML(item.answer)}</div>` : ''}<div class="doubt-item-foot"><span>${escapeHTML(item.time)}</span><span>${item.status === 'Answered' ? 'Faculty replied' : 'Usually answered in a few hours'}</span></div></article>`;
}

function renderDoubts() {
  const allDoubts = [...new Map([...initialDoubts, ...state.customDoubts].map((item) => [item.id, item])).values()];
  return `${renderIntro()}
    <div class="doubt-layout"><section class="form-panel"><h2>Ask your faculty</h2><p>Share what you’re stuck on. Add a photo if a diagram or question is easier to show.</p>
      <form data-form="doubt" id="doubt-form">
        <div class="form-field"><label for="doubt-subject">Subject</label><select id="doubt-subject" name="subject"><option>Physics</option><option>Mathematics</option><option>Chemistry</option><option>Biology</option></select></div>
        <div class="form-field"><label for="doubt-title">Give your doubt a title</label><input id="doubt-title" name="title" placeholder="e.g. How does friction act on this block?" required maxlength="90" /></div>
        <div class="form-field"><label for="doubt-body">Explain what you’ve tried so far</label><textarea id="doubt-body" name="body" placeholder="Add a little context so your teacher can help you faster..." required maxlength="800"></textarea></div>
        <input id="doubt-image" name="image" type="file" accept="image/*" hidden />
        ${state.attachedFilename ? `<span class="attachment-chip">${icon('image')}${escapeHTML(state.attachedFilename)}<button type="button" data-action="remove-attachment" aria-label="Remove attachment" style="border:0;background:none;color:inherit;cursor:pointer">${icon('x')}</button></span>` : ''}
        <div class="form-actions"><button class="attach-button" type="button" data-action="attach-photo">${icon('paperclip')} Add a photo</button><button class="btn btn-primary btn-compact" type="submit">Send doubt ${icon('send')}</button></div>
      </form>
    </section><section><div class="panel-header" style="margin:2px 1px 11px"><div class="panel-title-wrap"><h2 style="font-size:13px">Your recent doubts</h2><p>${allDoubts.length} questions in your history.</p></div></div><div class="doubt-list">${allDoubts.map(renderDoubtItem).join('')}</div></section></div>`;
}

function renderCommunityPost(post) {
  const voted = state.upvotes.has(post.id);
  const votes = post.votes + (voted ? 1 : 0);
  return `<article class="community-post"><div class="post-header"><span class="avatar avatar-small ${escapeHTML(post.color)}">${escapeHTML(post.initials)}</span><span class="post-author"><strong>${escapeHTML(post.name)}${post.verified ? '<i class="verified-mark">✓</i>' : ''}</strong><span>${escapeHTML(post.time)}</span></span><span class="post-subject">${escapeHTML(post.subject)}</span></div><h3>${escapeHTML(post.title)}</h3><p>${escapeHTML(post.text)}</p><div class="post-actions"><button class="post-action ${voted ? 'voted' : ''}" data-action="upvote" data-id="${escapeHTML(post.id)}">${icon('heart')}${votes} helpful</button><button class="post-action" data-action="show-toast" data-message="Replies are coming soon — keep sharing your ideas!">${icon('messageCircle')}${post.replies} replies</button><button class="post-action" style="margin-left:auto" data-action="show-toast" data-message="Post saved to your study space.">${icon('bookmark')}Save</button></div></article>`;
}

function renderCommunity() {
  const posts = [...new Map([...state.customPosts, ...starterPosts].map((post) => [post.id, post])).values()];
  return `${renderIntro()}
    <div class="community-layout"><section><form class="community-compose" data-form="community"><span class="avatar">AS</span><input name="post" maxlength="180" placeholder="Share a question or a small win with your community..." aria-label="Write a community post" required /><button type="submit" class="btn btn-primary btn-compact">Post ${icon('arrowRight')}</button></form>${posts.map(renderCommunityPost).join('')}</section>
      <aside class="community-side"><article class="community-side-card"><h3>Popular topics</h3><div class="topic-list"><div class="topic-row"><span>#NewtonLaws</span><span>126 posts</span></div><div class="topic-row"><span>#JEE2027</span><span>98 posts</span></div><div class="topic-row"><span>#StudyRoutine</span><span>74 posts</span></div><div class="topic-row"><span>#ChemistryShortcuts</span><span>53 posts</span></div></div></article><article class="community-side-card"><h3>This week’s helpers</h3><div class="topic-list"><div class="topic-row"><span>🥇 Sana Verma</span><span>42 helpful</span></div><div class="topic-row"><span>🥈 Kabir Mehta</span><span>36 helpful</span></div><div class="topic-row"><span>🥉 Aarav Sharma</span><span>28 helpful</span></div></div></article></aside>
    </div>`;
}

function renderProgress() {
  const hours = [31, 48, 39, 61, 46, 74, 57];
  const scores = [25, 37, 33, 52, 44, 64, 73];
  const subjects = [
    ['Physics · Laws of Motion', 68], ['Mathematics · Limits & Derivatives', 42], ['Chemistry · Chemical Bonding', 32], ['Physics · Work & Energy', 87],
  ];
  return `${renderIntro()}
    <section class="progress-top-grid"><article class="progress-kpi"><div class="progress-kpi-top"><span>Learning time · this month</span><span class="stat-icon violet">${icon('clock')}</span></div><strong>42.5 hrs</strong><span>↑ 12% from last month</span></article><article class="progress-kpi"><div class="progress-kpi-top"><span>Lessons completed</span><span class="stat-icon mint">${icon('checkCircle')}</span></div><strong>36 <small style="font:500 10px 'DM Sans';color:#929bac">/ 52</small></strong><span>You’re building a great rhythm</span></article><article class="progress-kpi"><div class="progress-kpi-top"><span>Best test score</span><span class="stat-icon amber">${icon('award')}</span></div><strong>94%</strong><span>Chapter test · ${state.xp} XP earned overall</span></article></section>
    <section class="analytics-grid"><article class="chart-card"><div class="panel-header"><div class="panel-title-wrap"><h2>Study activity</h2><p>Your focus is adding up, week by week.</p></div><button class="filter-chip selected" style="min-height:27px">Last 7 days ${icon('chevronDown')}</button></div><div class="chart-bars">${['M','T','W','T','F','S','S'].map((day, i) => `<div class="chart-column"><div class="bar-pair"><i style="height:${hours[i]}%"></i><i style="height:${scores[i]}%"></i></div><span>${day}</span></div>`).join('')}</div><div class="chart-legend"><span><i class="legend-dot"></i> Study hours</span><span><i class="legend-dot dark"></i> Practice score</span></div></article>
      <article class="chart-card"><div class="panel-header"><div class="panel-title-wrap"><h2>Chapter progress</h2><p>Keep chipping away.</p></div><button class="text-link" data-action="navigate" data-view="courses">View all ${icon('arrowRight')}</button></div><div class="chapter-progress-list">${subjects.map(([name, percent], i) => `<div class="chapter-progress-row"><div><strong>${name}</strong><div class="progress-track"><div class="progress-fill" style="width:${percent}%;background:${i === 1 ? 'linear-gradient(90deg,#4eafa0,#72cabb)' : i === 2 ? 'linear-gradient(90deg,#e6a46a,#f2c080)' : ''}"></div></div></div><span>${percent}%</span></div>`).join('')}</div></article>
    </section>
    <article class="panel panel-pad" style="margin-top:15px"><div class="panel-header"><div class="panel-title-wrap"><h2>Your achievements</h2><p>Little wins worth celebrating.</p></div><span class="tag orange">5 BADGES EARNED</span></div><div class="badge-grid"><div class="achievement"><span class="achievement-icon">${icon('flame')}</span><strong>5-Day Streak</strong><span>Showed up daily</span></div><div class="achievement"><span class="achievement-icon">${icon('zap')}</span><strong>Quick Learner</strong><span>Finished 10 lessons</span></div><div class="achievement"><span class="achievement-icon">${icon('target')}</span><strong>Sharp Shooter</strong><span>90% test accuracy</span></div><div class="achievement"><span class="achievement-icon">${icon('users')}</span><strong>Good Teammate</strong><span>Helped 5 learners</span></div></div></article>`;
}

function renderSettings() {
  const tabs = [
    ['Profile', 'users'], ['Notifications', 'bell'], ['Appearance', 'sun'], ['Privacy & security', 'lock'],
  ];
  const body = state.settingsTab === 'Notifications' ? `
    <div class="setting-row"><div><strong>Live class reminders</strong><span>Get a heads-up before class begins.</span></div><button class="toggle ${state.preferences.classReminders ? 'on' : ''}" data-action="toggle-setting" data-setting="classReminders" aria-label="Toggle class reminders"></button></div>
    <div class="setting-row"><div><strong>New study material</strong><span>Know when new notes are added to your courses.</span></div><button class="toggle ${state.preferences.newMaterials ? 'on' : ''}" data-action="toggle-setting" data-setting="newMaterials" aria-label="Toggle new material alerts"></button></div>
    <div class="setting-row"><div><strong>Weekly learning summary</strong><span>A gentle recap of your progress every Sunday.</span></div><button class="toggle ${state.preferences.weeklySummary ? 'on' : ''}" data-action="toggle-setting" data-setting="weeklySummary" aria-label="Toggle weekly summary"></button></div>
    <div class="setting-row"><div><strong>Study nudges</strong><span>Friendly reminders to take your next small step.</span></div><button class="toggle ${state.preferences.studyNudges ? 'on' : ''}" data-action="toggle-setting" data-setting="studyNudges" aria-label="Toggle study nudges"></button></div>` : state.settingsTab === 'Appearance' ? `
    <div class="setting-row"><div><strong>Dark appearance</strong><span>Use a softer, low-light look for your study space.</span></div><button class="toggle ${state.theme === 'dark' ? 'on' : ''}" data-action="toggle-theme" aria-label="Toggle dark appearance"></button></div>
    <div class="setting-row"><div><strong>Display language</strong><span>Choose how you’d like to use Dream Classes.</span></div><button class="filter-chip" data-action="toggle-popover" data-popover="language">${state.language === 'HI' ? 'हिन्दी' : 'English'} ${icon('chevronDown')}</button></div>` : state.settingsTab === 'Privacy & security' ? `
    <div class="setting-row"><div><strong>Account security</strong><span>Your learning account is protected with secure sign-in.</span></div><span class="tag green">SECURE</span></div>
    <div class="setting-row"><div><strong>Download your data</strong><span>Request a copy of your profile and learning history.</span></div><button class="btn btn-outline btn-compact" data-action="show-toast" data-message="Your data request has been noted.">Request data</button></div>
    <div class="setting-row"><div><strong>Need to update your number?</strong><span>Reach out to our support team and we’ll help.</span></div><button class="text-link" data-action="show-help">Contact support ${icon('arrowRight')}</button></div>` : `
    <div class="setting-row"><div><strong>Full name</strong><span>Aarav Sharma</span></div><button class="text-link" data-action="show-toast" data-message="Profile editing will be available soon.">Edit ${icon('arrowRight')}</button></div>
    <div class="setting-row"><div><strong>Mobile number</strong><span>+91 98••• ••421</span></div><span class="tag green">VERIFIED</span></div>
    <div class="setting-row"><div><strong>Learning plan</strong><span>Class 11 · JEE · PCM</span></div><button class="text-link" data-action="show-toast" data-message="Your learning plan is set to Class 11 JEE.">Change ${icon('arrowRight')}</button></div>
    <div class="setting-row"><div><strong>State board</strong><span>Jharkhand Academic Council</span></div><button class="text-link" data-action="show-toast" data-message="Board settings are up to date.">Edit ${icon('arrowRight')}</button></div>`;
  return `${renderIntro()}<section class="settings-layout"><nav class="settings-nav" aria-label="Settings sections">${tabs.map(([label, glyph]) => `<button class="${state.settingsTab === label ? 'selected' : ''}" data-action="settings-tab" data-tab="${label}">${icon(glyph)}${label}</button>`).join('')}</nav><article class="settings-panel"><h2>${state.settingsTab}</h2><p>Manage your ${state.settingsTab.toLowerCase()} preferences.</p>${body}</article></section>`;
}

function renderAdminOverview() {
  const activeStudents = state.adminStudents.filter((student) => student.status === 'Active').length;
  const scheduledClasses = liveClasses.length + state.adminScheduledClasses.length;
  const activities = [
    ['Aarav Sharma', 'enrolled in JEE Rank Booster 2027', '9:42 AM', 'AS'],
    ['Dr. Rohan Sen', 'published “Rotational Motion · Lecture 09”', '9:18 AM', 'RS'],
    ['Sana Verma', 'completed Physics Chapter Test · 88%', '8:56 AM', 'SV'],
    ['Aditi Kapoor', 'uploaded new Chemistry revision notes', 'Yesterday', 'AK'],
  ];
  return `${renderIntro()}
    <section class="admin-welcome"><div><span class="eyebrow">${icon('spark')} YOUR DAILY ADMIN BRIEFING · ${currentDateLabel().toUpperCase()}</span><h2>Good morning, Ronny.</h2><p>Your learning community is growing. Here’s what needs your attention today.</p></div><div class="admin-welcome-actions"><button class="btn btn-white" data-action="open-admin-modal" data-type="live">${icon('calendar')} Schedule a class</button><button class="btn btn-glass" data-action="open-admin-modal" data-type="batch">${icon('plus')} Create a batch</button></div></section>
    <section class="admin-metric-grid"><article class="admin-metric-card"><div class="admin-metric-top"><span class="stat-icon violet">${icon('users')}</span><span class="stat-trend">${icon('trending')} 12.4%</span></div><span class="admin-metric-label">Total students</span><strong>18,426</strong><small>${activeStudents.toLocaleString('en-IN')} active this month</small></article><article class="admin-metric-card"><div class="admin-metric-top"><span class="stat-icon mint">${icon('book')}</span><span class="tag green">ACTIVE</span></div><span class="admin-metric-label">Live learning batches</span><strong>${state.adminBatches.filter((batch) => batch.status === 'Live').length}</strong><small>${state.adminBatches.length} batches in your catalog</small></article><article class="admin-metric-card"><div class="admin-metric-top"><span class="stat-icon amber">${icon('video')}</span><span class="tag orange">TODAY</span></div><span class="admin-metric-label">Live classes</span><strong>06</strong><small>${scheduledClasses} sessions on this week</small></article><article class="admin-metric-card"><div class="admin-metric-top"><span class="stat-icon violet">${icon('target')}</span><span class="stat-trend">${icon('trending')} 4.6%</span></div><span class="admin-metric-label">Weekly engagement</span><strong>76.4%</strong><small>Average student activity</small></article></section>
    <section class="admin-overview-grid"><article class="chart-card"><div class="panel-header"><div class="panel-title-wrap"><h2>Platform growth</h2><p>Student sign-ups over the last 7 days</p></div><button class="filter-chip selected">This week ${icon('chevronDown')}</button></div><div class="admin-growth-chart">${[42,56,48,68,57,83,74].map((height, index) => `<div class="admin-growth-column"><span>${[128,164,141,193,177,238,216][index]}</span><i style="height:${height}%"></i><small>${['M','T','W','T','F','S','S'][index]}</small></div>`).join('')}</div><div class="chart-legend"><span><i class="legend-dot dark"></i> New student sign-ups</span><span style="margin-left:auto">1,157 this week</span></div></article>
      <article class="chart-card"><div class="panel-header"><div class="panel-title-wrap"><h2>Today’s live classes</h2><p>Faculty sessions scheduled</p></div><button class="text-link" data-action="navigate" data-view="admin-live">Manage schedule ${icon('arrowRight')}</button></div><div class="admin-live-list">${liveClasses.slice(0,3).map((item) => `<div class="admin-live-row"><div class="admin-time">${escapeHTML(item.time.split(' ')[0])}<small>${escapeHTML(item.time.split(' ')[1])}</small></div><span class="subject-tile">${icon(item.subject === 'Physics' ? 'atom' : item.subject === 'Chemistry' ? 'flask' : 'calculator')}</span><div class="admin-live-copy"><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.subject)} · ${escapeHTML(item.teacher)}</small></div><span class="status-pill ${item.id === 'rotational' ? '' : 'answered'}">${item.id === 'rotational' ? 'Soon' : 'Scheduled'}</span></div>`).join('')}</div><button class="btn btn-outline btn-compact btn-full" style="margin-top:12px" data-action="navigate" data-view="admin-live">View all live classes ${icon('arrowRight')}</button></article></section>
    <section class="admin-overview-grid admin-overview-grid-lower"><article class="panel panel-pad"><div class="panel-header"><div class="panel-title-wrap"><h2>Recent activity</h2><p>What’s happening across your platform.</p></div><button class="text-link" data-action="navigate" data-view="admin-analytics">View analytics ${icon('arrowRight')}</button></div><div class="admin-activity-list">${activities.map(([name, text, time, initials]) => `<div class="admin-activity-row"><span class="avatar avatar-small">${initials}</span><p><strong>${name}</strong> ${text}</p><time>${time}</time></div>`).join('')}</div></article><article class="panel panel-pad"><div class="panel-header"><div class="panel-title-wrap"><h2>Quick actions</h2><p>Keep your learning space moving.</p></div></div><div class="admin-quick-actions"><button class="admin-action-card" data-action="navigate" data-view="admin-students"><span class="quick-icon violet">${icon('users')}</span><span><strong>Manage students</strong><small>View, support and invite learners</small></span>${icon('arrowRight')}</button><button class="admin-action-card" data-action="open-admin-modal" data-type="batch"><span class="quick-icon teal">${icon('book')}</span><span><strong>Create a batch</strong><small>Set up a new course offering</small></span>${icon('arrowRight')}</button><button class="admin-action-card" data-action="navigate" data-view="admin-doubts"><span class="quick-icon orange">${icon('message')}</span><span><strong>Review doubt queue</strong><small>8 questions awaiting assignment</small></span>${icon('arrowRight')}</button></div></article></section>`;
}

function renderAdminStudents() {
  const term = state.adminStudentQuery.trim().toLowerCase();
  const list = state.adminStudents.filter((student) => {
    const filterMatch = state.adminStudentFilter === 'All students' || student.status === state.adminStudentFilter;
    return filterMatch && (!term || `${student.name} ${student.grade} ${student.batch}`.toLowerCase().includes(term));
  });
  return `${renderIntro()}<section class="admin-toolbar"><div class="admin-filter-group">${['All students','Active','Blocked'].map((filter) => `<button class="filter-chip ${state.adminStudentFilter === filter ? 'selected' : ''}" data-action="student-filter" data-filter="${filter}">${filter}</button>`).join('')}</div><div class="admin-toolbar-actions"><label class="admin-search">${icon('search')}<input id="admin-student-search" type="search" value="${escapeHTML(state.adminStudentQuery)}" placeholder="Search by name or batch..." aria-label="Search students" /></label><button class="btn btn-outline btn-compact" data-action="export-students">${icon('download')} Export</button><button class="btn btn-primary btn-compact" data-action="open-admin-modal" data-type="student">${icon('plus')} Add student</button></div></section>
    <section class="admin-table-card"><div class="admin-table-heading"><div><h2>All students <span class="count-bubble">${list.length}</span></h2><p>Review enrollment, recent activity and account status.</p></div><span class="tag green">${state.adminStudents.filter((student) => student.status === 'Active').length} ACTIVE</span></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>STUDENT</th><th>LEARNING PLAN</th><th>LAST ACTIVE</th><th>JOINED</th><th>STATUS</th><th></th></tr></thead><tbody>${list.length ? list.map((student) => `<tr><td><div class="admin-person"><span class="avatar avatar-small">${escapeHTML(student.initials)}</span><span><strong>${escapeHTML(student.name)}</strong><small>${escapeHTML(student.id)}</small></span></div></td><td><strong class="table-primary">${escapeHTML(student.grade)}</strong><small class="table-subline">${escapeHTML(student.batch)}</small></td><td>${escapeHTML(student.activity)}</td><td>${escapeHTML(student.joined)}</td><td><span class="status-pill ${student.status === 'Active' ? 'answered' : 'blocked'}">${escapeHTML(student.status)}</span></td><td><div class="table-actions"><button class="icon-button" data-action="student-detail" data-id="${student.id}" aria-label="View ${escapeHTML(student.name)}">${icon('eye')}</button><button class="icon-button" data-action="toggle-student-status" data-id="${student.id}" aria-label="${student.status === 'Active' ? 'Block' : 'Unblock'} ${escapeHTML(student.name)}">${icon(student.status === 'Active' ? 'lock' : 'check')}</button></div></td></tr>`).join('') : '<tr><td colspan="6"><div class="empty-state">No students match your search.</div></td></tr>'}</tbody></table></div><div class="admin-table-foot"><span>Showing ${list.length} of ${state.adminStudents.length} students</span><span>Student records are sample data in this prototype.</span></div></section>`;
}

function renderAdminFaculty() {
  return `${renderIntro()}<section class="admin-toolbar"><div class="admin-toolbar-copy"><strong>${state.adminFaculty.length} faculty members</strong><span>Teachers and subject specialists</span></div><div class="admin-toolbar-actions"><button class="btn btn-outline btn-compact" data-action="show-toast" data-message="Faculty directory exported for this demo.">${icon('download')} Export</button><button class="btn btn-primary btn-compact" data-action="open-admin-modal" data-type="faculty">${icon('plus')} Add faculty</button></div></section><section class="admin-table-card"><div class="admin-table-heading"><div><h2>Faculty directory</h2><p>Manage teaching assignments and faculty access.</p></div><button class="filter-chip selected">All subjects ${icon('chevronDown')}</button></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>FACULTY</th><th>SUBJECT</th><th>ASSIGNED BATCHES</th><th>SESSIONS</th><th>STATUS</th><th></th></tr></thead><tbody>${state.adminFaculty.map((teacher) => `<tr><td><div class="admin-person"><span class="avatar avatar-small avatar-violet">${escapeHTML(teacher.initials)}</span><span><strong>${escapeHTML(teacher.name)}</strong><small>${escapeHTML(teacher.id)}</small></span></div></td><td><span class="tag">${escapeHTML(teacher.subject)}</span></td><td>${escapeHTML(teacher.batches)}</td><td>${escapeHTML(teacher.sessions)}</td><td><span class="status-pill ${teacher.status === 'Active' ? 'answered' : ''}">${escapeHTML(teacher.status)}</span></td><td><button class="icon-button" data-action="show-toast" data-message="Faculty profile details opened.">${icon('more')}</button></td></tr>`).join('')}</tbody></table></div><div class="admin-table-foot"><span>Faculty permissions are managed by Super Admin.</span><span>Teacher sign-in is invitation-only.</span></div></section><div class="admin-info-banner">${icon('help')}<span>Need to change a teacher’s batch assignment? Open their profile from the faculty directory.</span></div>`;
}

function renderAdminBatches() {
  return `${renderIntro()}<section class="admin-toolbar"><div class="admin-toolbar-copy"><strong>${state.adminBatches.length} batches</strong><span>Manage courses, pricing and enrollment</span></div><div class="admin-toolbar-actions"><button class="btn btn-outline btn-compact" data-action="show-toast" data-message="Batch report exported.">${icon('download')} Export</button><button class="btn btn-primary btn-compact" data-action="open-admin-modal" data-type="batch">${icon('plus')} Create batch</button></div></section><section class="admin-batch-grid">${state.adminBatches.map((batch, index) => `<article class="admin-batch-card"><div class="admin-batch-art ${['art-physics','art-maths','art-chemistry'][index % 3]}"><span class="art-label">${escapeHTML(batch.grade.toUpperCase())}</span><span class="course-pill">${batch.status === 'Live' ? 'ENROLLMENT OPEN' : 'DRAFT'}</span><span class="art-formula">${index === 0 ? 'JEE' : index === 1 ? 'NEET' : 'X'}</span></div><div class="admin-batch-body"><div class="catalog-tags"><span class="tag">${escapeHTML(batch.grade.split('·')[1]?.trim() || 'Course')}</span><span class="tag ${batch.status === 'Live' ? 'green' : 'orange'}">${escapeHTML(batch.status)}</span></div><h3>${escapeHTML(batch.name)}</h3><p>${escapeHTML(batch.subjects)}</p><div class="admin-batch-stats"><span>${icon('users')} ${Number(batch.students).toLocaleString('en-IN')} students</span><span>${icon('calendar')} Starts ${escapeHTML(batch.start)}</span></div><div class="admin-batch-footer"><strong>₹${Number(batch.price).toLocaleString('en-IN')} <small>one-time fee</small></strong><button class="btn btn-outline btn-compact" data-action="show-toast" data-message="Batch details are ready to edit.">Manage ${icon('arrowRight')}</button></div></div></article>`).join('')}</section>`;
}

function renderAdminContent() {
  const content = [
    ...state.adminContent,
    { id: 'cnt-01', title: 'Rotational Motion · Lecture 09', type: 'Video', subject: 'Physics', batch: 'JEE Rank Booster 2027', date: 'Published today', status: 'Published' },
    { id: 'cnt-02', title: 'Newton’s Laws · Formula Sheet', type: 'PDF', subject: 'Physics', batch: 'JEE Rank Booster 2027', date: 'Updated 18 Oct', status: 'Published' },
    { id: 'cnt-03', title: 'Chemical Bonding · Quick Revision', type: 'PDF', subject: 'Chemistry', batch: 'NEET Achiever Batch', date: 'Draft · 20 Oct', status: 'Draft' },
  ];
  return `${renderIntro()}<div class="admin-content-layout"><section class="form-panel"><div class="admin-form-heading"><span class="quick-icon violet">${icon('upload')}</span><div><h2>Upload learning content</h2><p>Add a lecture, notes PDF or practice resource to a course.</p></div></div><form data-form="admin-content"><div class="form-field"><label for="content-title">Content title</label><input id="content-title" name="title" placeholder="e.g. Newton’s Laws — Lecture 04" required /></div><div class="admin-form-row"><div class="form-field"><label for="content-type">Type</label><select id="content-type" name="type"><option>Video</option><option>PDF notes</option><option>DPP</option><option>Formula sheet</option></select></div><div class="form-field"><label for="content-subject">Subject</label><select id="content-subject" name="subject"><option>Physics</option><option>Mathematics</option><option>Chemistry</option><option>Biology</option></select></div></div><div class="form-field"><label for="content-batch">Assign to batch</label><select id="content-batch" name="batch">${state.adminBatches.map((batch) => `<option>${escapeHTML(batch.name)}</option>`).join('')}</select></div><label class="admin-upload-zone" for="admin-content-file">${icon('upload')}<strong>Choose a file to upload</strong><span>Video, PDF or image · Max file size depends on your storage plan</span><input id="admin-content-file" name="file" type="file" accept="video/*,.pdf,image/*" /></label><div id="admin-upload-name" class="admin-upload-name">${state.adminUploadName ? `${icon('file')}${escapeHTML(state.adminUploadName)}` : ''}</div><div class="form-actions" style="margin-top:13px"><span class="footer-note">Content is saved as a local demo entry.</span><button class="btn btn-primary btn-compact" type="submit">Add to library ${icon('arrowRight')}</button></div></form></section><section class="admin-table-card"><div class="admin-table-heading"><div><h2>Recent content</h2><p>${content.length} items across your courses</p></div><button class="filter-chip selected">All content ${icon('chevronDown')}</button></div><div class="admin-content-list">${content.map((item) => `<div class="admin-content-row"><span class="file-icon ${item.type.includes('PDF') || item.type.includes('sheet') ? 'note' : 'sheet'}">${icon(item.type === 'Video' ? 'video' : 'file')}</span><div class="material-copy"><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.subject)} <span>·</span> ${escapeHTML(item.batch)} <span>·</span> ${escapeHTML(item.date)}</p></div><span class="status-pill ${item.status === 'Published' ? 'answered' : ''}">${escapeHTML(item.status)}</span><button class="icon-button" data-action="show-toast" data-message="Content details are ready to edit." aria-label="Content options">${icon('more')}</button></div>`).join('')}</div></section></div>`;
}

function renderAdminLive() {
  const classes = [...state.adminScheduledClasses.map((item) => ({ ...item, custom: true })), ...liveClasses.map((item) => ({ ...item, custom: false }))];
  return `${renderIntro()}<section class="admin-toolbar"><div class="admin-toolbar-copy"><strong>${classes.length} sessions scheduled</strong><span>All session times are in IST</span></div><div class="admin-toolbar-actions"><button class="btn btn-outline btn-compact" data-action="show-toast" data-message="Your live class schedule is up to date.">${icon('calendar')} Calendar view</button><button class="btn btn-primary btn-compact" data-action="open-admin-modal" data-type="live">${icon('plus')} Schedule class</button></div></section><section class="admin-table-card"><div class="admin-table-heading"><div><h2>Upcoming sessions</h2><p>Review faculty, batch and publication status.</p></div><span class="tag green">THIS WEEK</span></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>CLASS</th><th>DATE & TIME</th><th>FACULTY</th><th>BATCH</th><th>STATUS</th><th></th></tr></thead><tbody>${classes.map((item) => `<tr><td><strong class="table-primary">${escapeHTML(item.title)}</strong><small class="table-subline">${escapeHTML(item.subject)}</small></td><td>${escapeHTML(item.custom ? `${item.date} · ${item.time}` : `${item.month} · ${item.time}`)}</td><td>${escapeHTML(item.teacher || 'Faculty to assign')}</td><td>${escapeHTML(item.batch || 'JEE Rank Booster 2027')}</td><td><span class="status-pill ${item.custom || item.id !== 'rotational' ? 'answered' : ''}">${item.custom ? 'Scheduled' : item.id === 'rotational' ? 'Starting soon' : 'Scheduled'}</span></td><td><button class="icon-button" data-action="show-toast" data-message="Class options opened.">${icon('more')}</button></td></tr>`).join('')}</tbody></table></div><div class="admin-table-foot"><span>Recordings can be attached after the session.</span><span>Automated live video integrations are not connected in this demo.</span></div></section>`;
}

function renderAdminTests() {
  return `${renderIntro()}<section class="admin-toolbar"><div class="admin-toolbar-copy"><strong>${state.adminTests.length} assessments</strong><span>Question bank · chapter tests · full mocks</span></div><div class="admin-toolbar-actions"><button class="btn btn-outline btn-compact" data-action="show-toast" data-message="Question bank import is available in the full platform.">${icon('upload')} Import questions</button><button class="btn btn-primary btn-compact" data-action="open-admin-modal" data-type="test">${icon('plus')} Create test</button></div></section><section class="admin-table-card"><div class="admin-table-heading"><div><h2>Assessment library</h2><p>Publish tests to your course batches.</p></div><button class="filter-chip selected">All tests ${icon('chevronDown')}</button></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>ASSESSMENT</th><th>BATCH</th><th>QUESTIONS</th><th>SCHEDULE</th><th>STATUS</th><th></th></tr></thead><tbody>${state.adminTests.map((test) => `<tr><td><strong class="table-primary">${escapeHTML(test.title)}</strong><small class="table-subline">JEE pattern · Auto-scored</small></td><td>${escapeHTML(test.batch)}</td><td>${test.questions} questions</td><td>${escapeHTML(test.date)}</td><td><span class="status-pill ${test.status === 'Published' ? 'answered' : test.status === 'Draft' ? '' : 'scheduled'}">${escapeHTML(test.status)}</span></td><td>${test.status === 'Draft' ? `<button class="btn btn-soft btn-compact" data-action="publish-test" data-id="${test.id}">Publish</button>` : `<button class="icon-button" data-action="show-toast" data-message="Assessment options opened." aria-label="Assessment options">${icon('more')}</button>`}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function renderAdminDoubts() {
  const all = [...new Map([...initialDoubts, ...state.customDoubts].map((item) => [item.id, item])).values()];
  const open = all.filter((item) => item.status !== 'Answered' && !state.resolvedDoubts.has(item.id));
  return `${renderIntro()}<section class="admin-toolbar"><div class="admin-toolbar-copy"><strong>${open.length} questions need attention</strong><span>Prioritise unanswered learner questions.</span></div><div class="admin-toolbar-actions"><button class="filter-chip selected">Pending first ${icon('chevronDown')}</button></div></section><section class="doubt-list admin-doubt-list">${all.map((item) => { const resolved = item.status === 'Answered' || state.resolvedDoubts.has(item.id); const assigned = state.assignedDoubts.has(item.id); return `<article class="doubt-item"><div class="doubt-item-top"><span class="tag ${item.subject === 'Chemistry' ? 'orange' : ''}">${escapeHTML(item.subject)}</span><span class="status-pill ${resolved ? 'answered' : ''}">${resolved ? 'Resolved' : assigned ? 'Assigned' : 'Needs assignment'}</span></div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.body)}</p><div class="admin-doubt-meta"><span class="avatar avatar-small">${item.id.startsWith('d-') ? 'AS' : 'ST'}</span><span>Student · ${escapeHTML(item.time)}</span><span class="admin-doubt-spacer"></span><button class="btn btn-outline btn-compact" data-action="assign-doubt" data-id="${item.id}" ${resolved ? 'disabled' : ''}>${assigned ? 'Assigned to faculty' : 'Assign faculty'}</button><button class="btn ${resolved ? 'btn-soft' : 'btn-primary'} btn-compact" data-action="resolve-doubt" data-id="${item.id}" ${resolved ? 'disabled' : ''}>${resolved ? 'Resolved' : 'Mark resolved'}</button></div></article>`; }).join('')}</section>`;
}

function renderAdminNotifications() {
  const sent = state.adminNotifications;
  return `${renderIntro()}<div class="admin-notification-layout"><section class="form-panel"><div class="admin-form-heading"><span class="quick-icon orange">${icon('bell')}</span><div><h2>Compose a notification</h2><p>Share an update with students in the right course or batch.</p></div></div><form data-form="admin-notification"><div class="form-field"><label for="notice-audience">Send to</label><select id="notice-audience" name="audience"><option>All students</option>${state.adminBatches.map((batch) => `<option>${escapeHTML(batch.name)}</option>`).join('')}<option>Specific student</option></select></div><div class="form-field"><label for="notice-title">Notification title</label><input id="notice-title" name="title" maxlength="72" placeholder="e.g. Physics class starts in 30 minutes" required /></div><div class="form-field"><label for="notice-message">Message</label><textarea id="notice-message" name="message" maxlength="240" placeholder="Write a short, helpful update..." required style="min-height:90px"></textarea></div><div class="admin-form-row"><div class="form-field"><label for="notice-channel">Channel</label><select id="notice-channel" name="channel"><option>In-app</option><option>Push notification</option><option>Email</option></select></div><div class="form-field"><label for="notice-timing">Delivery</label><select id="notice-timing" name="timing"><option>Send now</option><option>Schedule for later</option></select></div></div><button class="btn btn-primary btn-compact" type="submit">Send notification ${icon('send')}</button></form></section><section class="panel panel-pad"><div class="panel-header"><div class="panel-title-wrap"><h2>Recent notifications</h2><p>${sent.length} sent from this browser.</p></div><span class="tag">ACTIVITY</span></div><div class="admin-notice-list">${sent.length ? sent.map((item) => `<article class="admin-notice-item"><span class="quick-icon violet">${icon('bell')}</span><div><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.message)}</p><small>${escapeHTML(item.audience)} · ${escapeHTML(item.channel)} · ${escapeHTML(item.date)}</small></div><span class="status-pill ${item.status === 'Sent' ? 'answered' : ''}">${escapeHTML(item.status)}</span></article>`).join('') : '<div class="empty-state">No notifications sent yet. Your recent activity will show here.</div>'}</div></section></div>`;
}

function renderAdminPayments() {
  const paid = state.adminTransactions.filter((txn) => txn.status === 'Paid').reduce((sum, txn) => sum + Number(txn.amount), 0);
  return `${renderIntro()}<section class="admin-metric-grid admin-payment-metrics"><article class="admin-metric-card"><div class="admin-metric-top"><span class="stat-icon mint">${icon('coin')}</span><span class="stat-trend">+8.2%</span></div><span class="admin-metric-label">Revenue this month</span><strong>₹12,84,600</strong><small>Net of refunds · October 2026</small></article><article class="admin-metric-card"><div class="admin-metric-top"><span class="stat-icon violet">${icon('checkCircle')}</span><span class="tag green">HEALTHY</span></div><span class="admin-metric-label">Successful payments</span><strong>${state.adminTransactions.filter((txn) => txn.status === 'Paid').length + 812}</strong><small>98.4% payment success rate</small></article><article class="admin-metric-card"><div class="admin-metric-top"><span class="stat-icon amber">${icon('refresh')}</span><span class="status-pill">REVIEW</span></div><span class="admin-metric-label">Refunds to review</span><strong>${state.adminTransactions.filter((txn) => txn.status === 'Refund requested').length}</strong><small>Needs finance team attention</small></article><article class="admin-metric-card"><div class="admin-metric-top"><span class="stat-icon violet">${icon('layers')}</span></div><span class="admin-metric-label">Sample transactions</span><strong>₹${paid.toLocaleString('en-IN')}</strong><small>From visible transaction records</small></article></section><section class="admin-table-card"><div class="admin-table-heading"><div><h2>Recent transactions</h2><p>Review payments and follow up on refund requests.</p></div><button class="btn btn-outline btn-compact" data-action="show-toast" data-message="Transaction report exported.">${icon('download')} Export report</button></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>TRANSACTION</th><th>STUDENT</th><th>COURSE</th><th>AMOUNT</th><th>DATE</th><th>STATUS</th><th></th></tr></thead><tbody>${state.adminTransactions.map((txn) => `<tr><td><strong class="table-primary">${escapeHTML(txn.id)}</strong></td><td>${escapeHTML(txn.name)}</td><td>${escapeHTML(txn.item)}</td><td><strong class="table-primary">₹${Number(txn.amount).toLocaleString('en-IN')}</strong></td><td>${escapeHTML(txn.date)}</td><td><span class="status-pill ${txn.status === 'Paid' ? 'answered' : txn.status === 'Refunded' ? 'blocked' : ''}">${escapeHTML(txn.status)}</span></td><td>${txn.status === 'Refund requested' ? `<button class="btn btn-outline btn-compact" data-action="approve-refund" data-id="${txn.id}">Review</button>` : '<button class="icon-button" data-action="show-toast" data-message="Invoice details opened.">' + icon('document') + '</button>'}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function renderAdminAnalytics() {
  return `${renderIntro()}<section class="admin-metric-grid"><article class="admin-metric-card"><div class="admin-metric-top"><span class="stat-icon violet">${icon('eye')}</span></div><span class="admin-metric-label">Lecture watch time</span><strong>24,860 hrs</strong><small>↑ 9.4% this month</small></article><article class="admin-metric-card"><div class="admin-metric-top"><span class="stat-icon mint">${icon('users')}</span></div><span class="admin-metric-label">Monthly active learners</span><strong>8,392</strong><small>45.6% of enrolled students</small></article><article class="admin-metric-card"><div class="admin-metric-top"><span class="stat-icon amber">${icon('target')}</span></div><span class="admin-metric-label">Average test accuracy</span><strong>72.8%</strong><small>Across 1,284 test attempts</small></article><article class="admin-metric-card"><div class="admin-metric-top"><span class="stat-icon violet">${icon('refresh')}</span></div><span class="admin-metric-label">30-day retention</span><strong>68.2%</strong><small>↑ 3.1 points from September</small></article></section><section class="admin-overview-grid"><article class="chart-card"><div class="panel-header"><div class="panel-title-wrap"><h2>Student engagement</h2><p>Weekly active learners · last 8 weeks</p></div><button class="filter-chip selected">Last 8 weeks ${icon('chevronDown')}</button></div><div class="admin-growth-chart">${[45,54,48,63,68,60,82,76].map((height, i) => `<div class="admin-growth-column"><span>${[4.1,4.8,4.5,5.3,5.8,5.6,6.6,6.2][i]}k</span><i style="height:${height}%"></i><small>${['S1','S2','S3','S4','S5','S6','S7','S8'][i]}</small></div>`).join('')}</div><div class="chart-legend"><span><i class="legend-dot dark"></i> Weekly active learners</span><span style="margin-left:auto">Engagement is trending up</span></div></article><article class="chart-card"><div class="panel-header"><div class="panel-title-wrap"><h2>Most-watched subjects</h2><p>Hours watched this month</p></div></div><div class="chapter-progress-list">${[['Physics',82],['Mathematics',69],['Chemistry',57],['Biology',41]].map(([name,pct],i)=>`<div class="chapter-progress-row"><div><strong>${name}</strong><div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${i===1?'linear-gradient(90deg,#4eafa0,#72cabb)':i===2?'linear-gradient(90deg,#e6a46a,#f2c080)':''}"></div></div></div><span>${pct}%</span></div>`).join('')}</div><div class="admin-info-banner">${icon('spark')}<span>Review lecture drop-off points to spot topics that may need a clearer explanation.</span></div></article></section>`;
}

function renderAdminSettings() {
  return `${renderIntro()}<section class="settings-layout"><nav class="settings-nav"><button class="selected">${icon('settings')}General</button><button data-action="show-toast" data-message="Roles & permissions settings are ready for integration.">${icon('lock')}Roles & permissions</button><button data-action="show-toast" data-message="Payment settings are ready for integration.">${icon('coin')}Payments</button><button data-action="show-toast" data-message="Notification settings are ready for integration.">${icon('bell')}Notifications</button></nav><article class="settings-panel"><h2>Workspace configuration</h2><p>These details appear across your Dream Classes platform.</p><div class="setting-row"><div><strong>Platform name</strong><span>Dream Classes</span></div><button class="text-link" data-action="show-toast" data-message="Platform branding is ready to edit.">Edit ${icon('arrowRight')}</button></div><div class="setting-row"><div><strong>Primary contact</strong><span>support@dreamclasses.in</span></div><button class="text-link" data-action="show-toast" data-message="Contact details are ready to edit.">Edit ${icon('arrowRight')}</button></div><div class="setting-row"><div><strong>Default learning language</strong><span>English · Hindi preference available</span></div><span class="tag green">ACTIVE</span></div><div class="setting-row"><div><strong>Student roles</strong><span>Student and Admin login · Faculty access by invitation</span></div><button class="text-link" data-action="show-toast" data-message="Role permissions are managed by Super Admin.">Manage ${icon('arrowRight')}</button></div><div class="admin-info-banner">${icon('lock')}<span>Authentication, SMS/OTP, payments, storage and notification providers need production credentials before launch.</span></div></article></section>`;
}

function renderAdminView() {
  switch (state.view) {
    case 'admin-students': return renderAdminStudents();
    case 'admin-faculty': return renderAdminFaculty();
    case 'admin-batches': return renderAdminBatches();
    case 'admin-content': return renderAdminContent();
    case 'admin-live': return renderAdminLive();
    case 'admin-tests': return renderAdminTests();
    case 'admin-doubts': return renderAdminDoubts();
    case 'admin-notifications': return renderAdminNotifications();
    case 'admin-payments': return renderAdminPayments();
    case 'admin-analytics': return renderAdminAnalytics();
    case 'admin-settings': return renderAdminSettings();
    default: return renderAdminOverview();
  }
}

function renderView() {
  if (state.role === 'admin') return renderAdminView();
  switch (state.view) {
    case 'courses': return renderCourses();
    case 'live': return renderLiveClasses();
    case 'practice': return renderPractice();
    case 'materials': return renderMaterials();
    case 'doubts': return renderDoubts();
    case 'community': return renderCommunity();
    case 'progress': return renderProgress();
    case 'settings': return renderSettings();
    default: return renderOverview();
  }
}

function renderApp() {
  document.body.classList.toggle('theme-dark', state.theme === 'dark');
  if (!state.authReady) {
    app.innerHTML = renderSplash();
    return;
  }
  if (!state.sessionUser) {
    app.innerHTML = renderLogin();
    return;
  }
  state.role = state.sessionUser.role;
  app.innerHTML = `${renderSidebar()}<div class="main-shell">${renderTopbar()}<main class="page-wrap">${renderView()}</main></div>`;
  updateSearchResults();
}

function updateSearchResults() {
  const results = document.getElementById('search-results');
  const input = document.getElementById('global-search');
  if (!results) return;
  results.innerHTML = renderSearchItems();
  results.classList.toggle('open', Boolean(state.searchOpen && state.query.trim()));
  if (input && input.value !== state.query) input.value = state.query;
}

function showToast(message, type = 'success') {
  const element = document.createElement('div');
  element.className = `toast ${type === 'error' ? 'error' : ''}`;
  element.innerHTML = `${icon(type === 'error' ? 'x' : 'checkCircle')}<span>${escapeHTML(message)}</span>`;
  toastRoot.appendChild(element);
  window.setTimeout(() => {
    element.classList.add('leaving');
    window.setTimeout(() => element.remove(), 200);
  }, 2800);
}

function navigate(view) {
  if (!pageMeta[view]) return;
  state.view = view;
  state.mobileOpen = false;
  state.popover = null;
  state.modal = null;
  state.quiz = null;
  if (quizTimer) { window.clearInterval(quizTimer); quizTimer = null; }
  modalRoot.innerHTML = '';
  state.searchOpen = false;
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openModal(type, data = {}) {
  state.modal = { type, ...data };
  state.popover = null;
  renderModal();
}

function closeModal() {
  state.modal = null;
  state.quiz = null;
  if (quizTimer) { window.clearInterval(quizTimer); quizTimer = null; }
  modalRoot.innerHTML = '';
}

function renderModal() {
  if (!state.modal) { modalRoot.innerHTML = ''; return; }
  let content = '';
  if (state.modal.type === 'live') content = renderLiveModal();
  if (state.modal.type === 'course') content = renderCourseModal();
  if (state.modal.type === 'material') content = renderMaterialModal();
  if (state.modal.type === 'quiz') content = renderQuizModal();
  if (state.modal.type === 'help') content = renderHelpModal();
  if (state.modal.type.startsWith('admin-') || state.modal.type === 'student-detail') content = renderAdminModal();
  modalRoot.innerHTML = `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-card ${state.modal.type === 'quiz' ? '' : ''}" role="dialog" aria-modal="true" aria-label="${escapeHTML(state.modal.ariaLabel || 'Dream Classes dialog')}">${content}</section></div>`;
  const firstButton = modalRoot.querySelector('button:not([disabled])');
  if (firstButton) window.setTimeout(() => firstButton.focus({ preventScroll: true }), 20);
}

function renderLiveModal() {
  const item = liveClasses.find((row) => row.id === state.modal.id) || liveClasses[0];
  return `<div class="modal-top"><div><h2>Your classroom is ready</h2><p>You’re all set for ${escapeHTML(item.title)}.</p></div><button class="modal-close" data-action="close-modal" aria-label="Close">${icon('x')}</button></div>
    <div class="live-modal-art">${icon('video')}</div>
    <div class="modal-body"><span class="tag">${escapeHTML(item.subject)} · CLASS 11 JEE</span><div class="modal-info-grid"><div class="modal-info"><span>Class time</span><strong>Today · ${escapeHTML(item.time)} IST</strong></div><div class="modal-info"><span>Teacher</span><strong>${escapeHTML(item.teacher)}</strong></div><div class="modal-info"><span>Duration</span><strong>60 minutes</strong></div><div class="modal-info"><span>Classroom</span><strong>Dream Classes Live</strong></div></div><p style="margin:13px 0 0;color:#929bac;font-size:9px;line-height:1.65">This preview shows the class entry point. Your live classroom and attendance will be available when connected to your course account.</p></div>
    <div class="modal-footer"><span class="footer-note">Check your connection before class begins.</span><button class="btn btn-primary btn-compact" data-action="add-reminder" data-id="${item.id}">${icon('bell')} Remind me</button></div>`;
}

function renderCourseModal() {
  const course = courseData.find((item) => item.id === state.modal.id) || courseData[0];
  return `<div class="modal-top"><div><span class="tag">${escapeHTML(course.exam)} · ${escapeHTML(course.grade)}</span><h2 style="margin-top:8px">${escapeHTML(course.title)}</h2><p>${escapeHTML(course.description)}</p></div><button class="modal-close" data-action="close-modal" aria-label="Close">${icon('x')}</button></div>
    <div class="modal-body"><div class="teacher-line" style="gap:8px"><span class="avatar ${course.teacherColor}">${escapeHTML(course.teacherInitials)}</span><span style="font-size:9px;color:#778196">Taught by <strong style="color:#59647a">${escapeHTML(course.teacher)}</strong></span></div>
      ${course.enrolled ? `<div class="course-modal-progress"><div class="progress-meta"><span>Your course progress</span><strong>${course.progress}% complete</strong></div><div class="progress-track"><div class="progress-fill" style="width:${course.progress}%"></div></div><div class="modal-list"><div class="modal-list-row">${icon('play')}<span>Next lesson: ${escapeHTML(course.next)}</span><strong>18 min</strong></div><div class="modal-list-row">${icon('file')}<span>Class notes and practice sheets included</span><strong>${course.lessons} lessons</strong></div></div></div>` : `<div class="modal-info-grid"><div class="modal-info"><span>Course content</span><strong>${course.lessons} expert-led lessons</strong></div><div class="modal-info"><span>Learning time</span><strong>${escapeHTML(course.duration)}</strong></div><div class="modal-info"><span>Live support</span><strong>Weekly doubt classes</strong></div><div class="modal-info"><span>Course fee</span><strong>₹${course.price.toLocaleString('en-IN')} one-time</strong></div></div>`}
    </div><div class="modal-footer"><span class="footer-note">${course.enrolled ? 'Pick up right where you left off.' : 'Secure access · Learn at your pace'}</span><button class="btn btn-primary btn-compact" data-action="course-cta" data-id="${course.id}">${course.enrolled ? 'Continue course' : 'Enroll in this batch'} ${icon('arrowRight')}</button></div>`;
}

function renderMaterialModal() {
  const item = materialData.find((row) => row.id === state.modal.id) || materialData[0];
  return `<div class="modal-top"><div><span class="tag">${escapeHTML(item.subject)} · ${escapeHTML(item.category)}</span><h2 style="margin-top:8px">${escapeHTML(item.title)}</h2><p>${escapeHTML(item.meta)} · ${escapeHTML(item.date)}</p></div><button class="modal-close" data-action="close-modal" aria-label="Close">${icon('x')}</button></div>
    <div class="modal-body"><div style="min-height:215px;display:grid;place-items:center;padding:20px;border:1px solid #eceef4;border-radius:12px;background:linear-gradient(180deg,#fbfbfe,#f4f5fa)"><div style="width:min(100%,250px);padding:20px 22px;border-radius:7px;background:#fff;box-shadow:0 7px 24px rgba(38,46,82,.09)"><span class="tag">DREAM CLASSES · ${escapeHTML(item.subject.toUpperCase())}</span><h3 style="margin:16px 0 8px;color:#39435c;font:800 14px Manrope,sans-serif">${escapeHTML(item.title)}</h3><div style="height:5px;width:100%;margin:12px 0;border-radius:8px;background:#eceef5"></div><div style="height:5px;width:84%;margin:8px 0;border-radius:8px;background:#eceef5"></div><div style="height:5px;width:92%;margin:8px 0;border-radius:8px;background:#eceef5"></div><div style="height:5px;width:65%;margin:8px 0;border-radius:8px;background:#eceef5"></div><p style="margin:15px 0 0;color:#abb1be;font-size:8px">PDF reader preview · ${escapeHTML(item.meta)}</p></div></div><p style="margin:12px 0 0;color:#929bac;font-size:9px;line-height:1.6">Your full in-app PDF reader will open here. Bookmark this resource to find it quickly during revision.</p></div>
    <div class="modal-footer"><button class="btn btn-outline btn-compact" data-action="toggle-bookmark" data-id="${item.id}">${icon('bookmark')}${state.savedMaterials.has(item.id) ? 'Saved' : 'Bookmark'}</button><button class="btn btn-primary btn-compact" data-action="download-material" data-id="${item.id}">${icon('download')} Save for offline</button></div>`;
}

function renderQuizModal() {
  if (!state.quiz) state.quiz = { index: 0, selected: null, answers: [], submitted: false, title: 'Daily Practice Problems', remaining: 900 };
  const quiz = state.quiz;
  if (quiz.submitted) {
    const correct = quiz.answers.reduce((count, answer, index) => count + (answer === questions[index].answer ? 1 : 0), 0);
    return `<div class="modal-top"><div><span class="tag green">DPP COMPLETE</span><h2 style="margin-top:8px">Nice work, Aarav!</h2><p>You showed up and gave it a go. That’s what counts.</p></div><button class="modal-close" data-action="close-modal" aria-label="Close">${icon('x')}</button></div><div class="modal-body"><div class="quiz-result"><span class="result-medal">${icon('award')}</span><h3>${correct === questions.length ? 'Perfect score!' : 'A solid effort!'}</h3><p>${correct === questions.length ? 'You nailed every question. Keep that momentum going.' : 'Review the explanations and you’ll be even stronger next time.'}</p><span class="result-score">${correct}<small>/ ${questions.length} correct</small></span></div><div class="modal-list">${questions.map((q, index) => `<div class="modal-list-row">${icon(quiz.answers[index] === q.answer ? 'checkCircle' : 'question')}<span>${escapeHTML(q.explanation)}</span><strong>${quiz.answers[index] === q.answer ? 'Correct' : 'Review'}</strong></div>`).join('')}</div></div><div class="modal-footer"><span class="footer-note">+50 XP earned · ${state.xp} XP total</span><button class="btn btn-primary btn-compact" data-action="quiz-done">Done ${icon('check')}</button></div>`;
  }
  const question = questions[quiz.index];
  const minutes = String(Math.floor(quiz.remaining / 60)).padStart(2, '0');
  const seconds = String(quiz.remaining % 60).padStart(2, '0');
  return `<div class="modal-top"><div><span class="tag">PHYSICS · LAWS OF MOTION</span><h2 style="margin-top:8px">${escapeHTML(quiz.title)}</h2><p>A little practice goes a long way.</p></div><button class="modal-close" data-action="close-modal" aria-label="Close">${icon('x')}</button></div><div class="modal-body"><div class="quiz-progress-head"><span>Question <strong>${quiz.index + 1}</strong> of ${questions.length}</span><span class="timer">${icon('clock')} <span id="quiz-clock">${minutes}:${seconds}</span></span></div><div class="progress-track" style="margin-bottom:17px"><div class="progress-fill" style="width:${((quiz.index + 1) / questions.length) * 100}%"></div></div><h3 class="quiz-question">${escapeHTML(question.question)}</h3><div class="answer-list">${question.options.map((option, index) => `<button class="answer-option ${quiz.selected === index ? 'selected' : ''}" data-action="select-answer" data-answer="${index}"><span class="answer-letter">${String.fromCharCode(65 + index)}</span>${escapeHTML(option)}</button>`).join('')}</div></div><div class="modal-footer"><span class="footer-note">No negative marking · Take your time</span><button class="btn btn-primary btn-compact" data-action="quiz-next" ${quiz.selected === null ? 'disabled' : ''}>${quiz.index === questions.length - 1 ? 'Submit DPP' : 'Next question'} ${icon('arrowRight')}</button></div>`;
}

function renderAdminModal() {
  const type = state.modal.type;
  if (type === 'student-detail') {
    const student = state.adminStudents.find((item) => item.id === state.modal.id) || state.adminStudents[0];
    if (!student) return '';
    return `<div class="modal-top"><div><span class="tag green">${escapeHTML(student.status.toUpperCase())} STUDENT</span><h2 style="margin-top:8px">${escapeHTML(student.name)}</h2><p>${escapeHTML(student.grade)} · Joined ${escapeHTML(student.joined)}</p></div><button class="modal-close" data-action="close-modal" aria-label="Close">${icon('x')}</button></div><div class="modal-body"><div class="admin-detail-profile"><span class="avatar avatar-blue">${escapeHTML(student.initials)}</span><div><strong>${escapeHTML(student.name)}</strong><small>Student ID · ${escapeHTML(student.id)}</small></div><span class="status-pill ${student.status === 'Active' ? 'answered' : 'blocked'}">${escapeHTML(student.status)}</span></div><div class="modal-info-grid"><div class="modal-info"><span>Learning plan</span><strong>${escapeHTML(student.grade)}</strong></div><div class="modal-info"><span>Enrolled batch</span><strong>${escapeHTML(student.batch)}</strong></div><div class="modal-info"><span>Last active</span><strong>${escapeHTML(student.activity)}</strong></div><div class="modal-info"><span>Learning progress</span><strong>68% · On track</strong></div></div><div class="course-modal-progress"><div class="progress-meta"><span>Course completion</span><strong>68%</strong></div><div class="progress-track"><div class="progress-fill" style="width:68%"></div></div></div><p style="margin:13px 0 0;color:#949cad;font-size:9px;line-height:1.65">Student profile, purchases and progress data shown here are sample content for this admin demo.</p></div><div class="modal-footer"><button class="btn btn-outline btn-compact" data-action="show-toast" data-message="A student notification is ready to compose.">${icon('bell')} Send update</button><button class="btn ${student.status === 'Active' ? 'btn-danger-soft' : 'btn-primary'} btn-compact" data-action="toggle-student-status" data-id="${student.id}">${icon(student.status === 'Active' ? 'lock' : 'check')}${student.status === 'Active' ? 'Block account' : 'Unblock account'}</button></div>`;
  }

  const definitions = {
    'admin-student': { title: 'Add a student', description: 'Invite a learner to their Dream Classes workspace.', form: 'admin-student', submit: 'Add student', fields: `<div class="form-field"><label>Full name</label><input name="name" placeholder="Student name" required maxlength="70" /></div><div class="admin-form-row"><div class="form-field"><label>Mobile number</label><input name="phone" type="tel" placeholder="+91 98••• ••000" required /></div><div class="form-field"><label>Class</label><select name="grade"><option>Class 6</option><option>Class 7</option><option>Class 8</option><option>Class 9</option><option>Class 10</option><option selected>Class 11</option><option>Class 12</option></select></div></div><div class="form-field"><label>Learning batch</label><select name="batch">${state.adminBatches.map((batch) => `<option>${escapeHTML(batch.name)}</option>`).join('')}</select></div>` },
    'admin-faculty': { title: 'Add faculty', description: 'Create a faculty profile. Teacher access is invitation-only.', form: 'admin-faculty', submit: 'Add faculty', fields: `<div class="form-field"><label>Teacher name</label><input name="name" placeholder="Full name" required maxlength="70" /></div><div class="form-field"><label>Email address</label><input name="email" type="email" placeholder="teacher@dreamclasses.in" required /></div><div class="admin-form-row"><div class="form-field"><label>Subject</label><select name="subject"><option>Physics</option><option>Mathematics</option><option>Chemistry</option><option>Biology</option></select></div><div class="form-field"><label>Assigned batch</label><select name="batch">${state.adminBatches.map((batch) => `<option>${escapeHTML(batch.name)}</option>`).join('')}</select></div></div>` },
    'admin-batch': { title: 'Create a batch', description: 'Set up a course with a clear plan and start date.', form: 'admin-batch', submit: 'Create batch', fields: `<div class="form-field"><label>Batch name</label><input name="name" placeholder="e.g. JEE Foundation 2027" required maxlength="80" /></div><div class="admin-form-row"><div class="form-field"><label>Class</label><select name="grade"><option>Class 6</option><option>Class 7</option><option>Class 8</option><option>Class 9</option><option>Class 10</option><option selected>Class 11</option><option>Class 12</option></select></div><div class="form-field"><label>Target exam</label><select name="exam"><option>JEE</option><option>NEET</option><option>Boards</option><option>Olympiad</option><option>State Board</option></select></div></div><div class="admin-form-row"><div class="form-field"><label>Course price (₹)</label><input name="price" type="number" min="0" value="0" required /></div><div class="form-field"><label>Start date</label><input name="start" type="date" required /></div></div><div class="form-field"><label>Subjects</label><input name="subjects" placeholder="Physics, Chemistry, Mathematics" required /></div>` },
    'admin-live': { title: 'Schedule a live class', description: 'Add a class to the batch schedule and notify learners.', form: 'admin-live', submit: 'Schedule class', fields: `<div class="form-field"><label>Class title</label><input name="title" placeholder="e.g. Work, Energy & Power" required maxlength="90" /></div><div class="admin-form-row"><div class="form-field"><label>Subject</label><select name="subject"><option>Physics</option><option>Mathematics</option><option>Chemistry</option><option>Biology</option></select></div><div class="form-field"><label>Faculty</label><select name="teacher">${state.adminFaculty.map((teacher) => `<option>${escapeHTML(teacher.name)}</option>`).join('')}</select></div></div><div class="form-field"><label>Batch</label><select name="batch">${state.adminBatches.map((batch) => `<option>${escapeHTML(batch.name)}</option>`).join('')}</select></div><div class="admin-form-row"><div class="form-field"><label>Date</label><input name="date" type="date" required /></div><div class="form-field"><label>Time</label><input name="time" type="time" required /></div></div>` },
    'admin-test': { title: 'Create a test', description: 'Prepare an assessment for one of your learning batches.', form: 'admin-test', submit: 'Create test', fields: `<div class="form-field"><label>Test title</label><input name="title" placeholder="e.g. Laws of Motion · Chapter Test" required maxlength="90" /></div><div class="admin-form-row"><div class="form-field"><label>Batch</label><select name="batch">${state.adminBatches.map((batch) => `<option>${escapeHTML(batch.name)}</option>`).join('')}</select></div><div class="form-field"><label>Number of questions</label><input name="questions" type="number" min="1" max="300" value="20" required /></div></div><div class="admin-form-row"><div class="form-field"><label>Publish date</label><input name="date" type="date" required /></div><div class="form-field"><label>Negative marking</label><select name="negative"><option>No negative marking</option><option>-1 for each incorrect</option><option>-0.25 for each incorrect</option></select></div></div>` },
  };
  const config = definitions[type];
  if (!config) return '';
  return `<div class="modal-top"><div><h2>${config.title}</h2><p>${config.description}</p></div><button class="modal-close" data-action="close-modal" aria-label="Close">${icon('x')}</button></div><form data-form="${config.form}"><div class="modal-body">${config.fields}</div><div class="modal-footer"><span class="footer-note">Changes are saved in this browser demo.</span><button class="btn btn-primary btn-compact" type="submit">${config.submit} ${icon('arrowRight')}</button></div></form>`;
}

function renderHelpModal() {
  return `<div class="modal-top"><div><h2>We’re here to help</h2><p>Reach out to the Dream Classes support team.</p></div><button class="modal-close" data-action="close-modal" aria-label="Close">${icon('x')}</button></div><div class="modal-body"><div class="modal-info-grid"><div class="modal-info"><span>Student support</span><strong>support@dreamclasses.in</strong></div><div class="modal-info"><span>Hours</span><strong>Mon–Sat · 9 AM–6 PM IST</strong></div></div><p style="margin:13px 0 0;color:#929bac;font-size:9px;line-height:1.6">For a subject question, use the Doubt solving section so your teacher can see the full context.</p></div><div class="modal-footer"><span class="footer-note">We usually reply within one working day.</span><button class="btn btn-primary btn-compact" data-action="navigate" data-view="${state.role === 'admin' ? 'admin-doubts' : 'doubts'}">${state.role === 'admin' ? 'Open doubt queue' : 'Ask a doubt'} ${icon('arrowRight')}</button></div>`;
}

function toggleInSet(set, id, key) {
  if (set.has(id)) set.delete(id); else set.add(id);
  writeStore(key, [...set]);
}

function awardQuizXP() {
  if (!state.quiz || state.quiz.xpAwarded) return;
  state.quiz.xpAwarded = true;
  state.xp += 50;
  writeStore('dream-xp', state.xp);
}

async function signOutAndOpenLogin(role = 'student') {
  try { await apiRequest('/api/auth/logout', { method: 'POST' }); } catch { /* The local session is cleared even if the API is unavailable. */ }
  state.sessionUser = null;
  state.authReady = true;
  state.loginRole = role === 'admin' ? 'admin' : 'student';
  state.loginStep = 'phone';
  state.loginPhone = '';
  state.loginOtp = '';
  state.demoOtp = '';
  state.loginError = '';
  state.popover = null;
  state.modal = null;
  modalRoot.innerHTML = '';
  renderApp();
}

async function updateStudentStatus(id) {
  const student = state.adminStudents.find((item) => item.id === id);
  if (!student) return;
  const status = student.status === 'Active' ? 'Blocked' : 'Active';
  try {
    const result = await apiRequest(`/api/admin/students/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status } });
    Object.assign(student, result.item);
    writeStore('dream-admin-students', state.adminStudents);
    closeModal(); renderApp(); showToast(`${student.name} is now ${student.status.toLowerCase()}.`);
  } catch (error) { showToast(error.message, 'error'); }
}

async function updateAdminDoubt(id, operation) {
  try {
    const result = await apiRequest(`/api/admin/doubts/${encodeURIComponent(id)}/${operation}`, { method: 'POST', body: {} });
    const index = state.customDoubts.findIndex((item) => item.id === id);
    if (index >= 0) state.customDoubts[index] = result.item;
    else state.customDoubts.unshift(result.item);
    if (operation === 'assign') state.assignedDoubts.add(id);
    if (operation === 'resolve') state.resolvedDoubts.add(id);
    writeStore('dream-doubts', state.customDoubts);
    writeStore('dream-assigned-doubts', [...state.assignedDoubts]);
    writeStore('dream-resolved-doubts', [...state.resolvedDoubts]);
    renderApp(); showToast(operation === 'assign' ? 'Doubt assigned to the subject faculty.' : 'Doubt marked as resolved.');
  } catch (error) { showToast(error.message, 'error'); }
}

async function publishAdminTest(id) {
  const test = state.adminTests.find((item) => item.id === id);
  if (!test) return;
  try {
    const result = await apiRequest(`/api/admin/tests/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status: 'Published' } });
    Object.assign(test, result.item);
    writeStore('dream-admin-tests', state.adminTests);
    renderApp(); showToast('Assessment published to its batch.');
  } catch (error) { showToast(error.message, 'error'); }
}

function startQuiz(title = 'Daily Practice Problems') {
  state.quiz = { index: 0, selected: null, answers: [], submitted: false, title, remaining: 900 };
  openModal('quiz');
  quizTimer = window.setInterval(() => {
    if (!state.quiz || state.quiz.submitted || state.modal?.type !== 'quiz') {
      window.clearInterval(quizTimer);
      quizTimer = null;
      return;
    }
    state.quiz.remaining = Math.max(0, state.quiz.remaining - 1);
    const clock = document.getElementById('quiz-clock');
    if (clock) {
      const minutes = String(Math.floor(state.quiz.remaining / 60)).padStart(2, '0');
      const seconds = String(state.quiz.remaining % 60).padStart(2, '0');
      clock.textContent = `${minutes}:${seconds}`;
    }
    if (state.quiz.remaining === 0) {
      if (state.quiz.selected !== null) state.quiz.answers[state.quiz.index] = state.quiz.selected;
      while (state.quiz.answers.length < questions.length) state.quiz.answers.push(-1);
      state.quiz.submitted = true;
      awardQuizXP();
      window.clearInterval(quizTimer);
      quizTimer = null;
      renderModal();
      showToast('Time is up. Review your answers and keep practising.', 'error');
    }
  }, 1000);
}

function handleAction(button, event) {
  const action = button.dataset.action;
  const id = button.dataset.id;
  switch (action) {
    case 'navigate':
      event.preventDefault();
      navigate(button.dataset.view);
      break;
    case 'toggle-mobile':
      state.mobileOpen = !state.mobileOpen;
      renderApp();
      break;
    case 'close-mobile':
      if (state.mobileOpen && event.target === button) { state.mobileOpen = false; renderApp(); }
      break;
    case 'toggle-popover':
      state.popover = state.popover === button.dataset.popover ? null : button.dataset.popover;
      renderApp();
      break;
    case 'toggle-profile':
      state.popover = state.popover === 'profile' ? null : 'profile';
      renderApp();
      break;
    case 'switch-role':
      signOutAndOpenLogin(button.dataset.role);
      break;
    case 'logout':
      signOutAndOpenLogin('student');
      break;
    case 'login-role': {
      const nextRole = button.dataset.role === 'admin' ? 'admin' : 'student';
      if (nextRole !== state.loginRole) {
        state.loginStep = 'phone';
        state.loginOtp = '';
        state.demoOtp = '';
      }
      state.loginRole = nextRole;
      state.loginError = '';
      renderApp();
      break;
    }
    case 'back-to-phone':
      state.loginStep = 'phone';
      state.loginOtp = '';
      state.demoOtp = '';
      state.loginError = '';
      renderApp();
      break;
    case 'copy-demo-otp':
      if (state.demoOtp && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(state.demoOtp).then(() => showToast('Demo code copied.')).catch(() => showToast(`Demo OTP: ${state.demoOtp}`));
      } else showToast(`Demo OTP: ${state.demoOtp}`);
      break;
    case 'google-login-info':
      showToast('Google sign-in needs its OAuth provider configuration before launch.');
      break;
    case 'noop':
      event.preventDefault();
      break;
    case 'set-language':
      state.language = button.dataset.language;
      writeStore('dream-language', state.language);
      state.popover = null;
      renderApp();
      showToast(`Language preference saved: ${state.language === 'HI' ? 'हिन्दी' : 'English'}.`);
      break;
    case 'mark-read':
      state.notificationsRead = true;
      writeStore('dream-notifications-read', true);
      state.popover = null;
      renderApp();
      showToast('You’re all caught up.');
      break;
    case 'continue-course':
      openModal('course', { id: id || 'laws-motion' });
      break;
    case 'open-course':
      openModal('course', { id });
      break;
    case 'course-cta': {
      const course = courseData.find((item) => item.id === id);
      closeModal();
      if (course?.enrolled) {
        showToast(`Picking up ${course.title} where you left off.`);
        navigate('courses');
      } else if (course) {
        showToast(`Your interest in ${course.title} is saved. Enrollment checkout can be connected next.`);
      }
      break;
    }
    case 'join-live':
      openModal('live', { id });
      break;
    case 'set-reminder':
    case 'add-reminder':
      toggleInSet(state.reminders, id, 'dream-reminders');
      closeModal();
      showToast(state.reminders.has(id) ? 'Reminder set for this class.' : 'Class reminder removed.');
      break;
    case 'course-filter':
      state.courseFilter = button.dataset.filter;
      renderApp();
      break;
    case 'material-filter':
      state.materialFilter = button.dataset.filter;
      renderApp();
      break;
    case 'open-admin-modal':
      openModal(`admin-${button.dataset.type}`);
      break;
    case 'student-filter':
      state.adminStudentFilter = button.dataset.filter;
      renderApp();
      break;
    case 'student-detail':
      openModal('student-detail', { id });
      break;
    case 'toggle-student-status':
      updateStudentStatus(id);
      break;
    case 'export-students':
      showToast('Student report exported for this demo.');
      break;
    case 'assign-doubt':
      updateAdminDoubt(id, 'assign');
      break;
    case 'resolve-doubt':
      updateAdminDoubt(id, 'resolve');
      break;
    case 'publish-test':
      publishAdminTest(id);
      break;
    case 'approve-refund': {
      const txn = state.adminTransactions.find((item) => item.id === id);
      if (!txn) break;
      txn.status = 'Refunded';
      writeStore('dream-admin-transactions', state.adminTransactions);
      renderApp();
      showToast(`Refund marked complete for ${txn.id}.`);
      break;
    }
    case 'view-material':
      openModal('material', { id });
      break;
    case 'search-material':
      state.query = '';
      state.searchOpen = false;
      state.view = 'materials';
      state.materialQuery = '';
      navigate('materials');
      window.setTimeout(() => openModal('material', { id }), 50);
      break;
    case 'toggle-bookmark':
      toggleInSet(state.savedMaterials, id, 'dream-saved-materials');
      if (state.modal?.type === 'material') renderModal(); else renderApp();
      showToast(state.savedMaterials.has(id) ? 'Added to your saved resources.' : 'Removed from saved resources.');
      break;
    case 'download-material':
      toggleInSet(state.downloadedMaterials, id, 'dream-downloaded-materials');
      if (state.modal?.type === 'material') renderModal(); else renderApp();
      showToast(state.downloadedMaterials.has(id) ? 'Saved to your offline list.' : 'Removed from your offline list.');
      break;
    case 'start-dpp':
      startQuiz(button.dataset.test || 'Daily Practice Problems');
      break;
    case 'select-answer':
      if (state.quiz && !state.quiz.submitted) {
        state.quiz.selected = Number(button.dataset.answer);
        renderModal();
      }
      break;
    case 'quiz-next':
      if (!state.quiz || state.quiz.selected === null) return;
      state.quiz.answers[state.quiz.index] = state.quiz.selected;
      if (state.quiz.index < questions.length - 1) {
        state.quiz.index += 1;
        state.quiz.selected = state.quiz.answers[state.quiz.index] ?? null;
      } else {
        state.quiz.submitted = true;
        awardQuizXP();
      }
      renderModal();
      break;
    case 'quiz-done':
      closeModal();
      state.view = 'progress';
      renderApp();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Your practice progress has been updated.');
      break;
    case 'attach-photo':
      document.getElementById('doubt-image')?.click();
      break;
    case 'remove-attachment':
      state.attachedFilename = '';
      renderApp();
      break;
    case 'upvote':
      toggleInSet(state.upvotes, id, 'dream-upvotes');
      renderApp();
      break;
    case 'settings-tab':
      state.settingsTab = button.dataset.tab;
      renderApp();
      break;
    case 'toggle-setting':
      state.preferences[button.dataset.setting] = !state.preferences[button.dataset.setting];
      writeStore('dream-preferences', state.preferences);
      renderApp();
      break;
    case 'toggle-theme':
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      writeStore('dream-theme', state.theme);
      renderApp();
      break;
    case 'show-help':
      openModal('help');
      break;
    case 'show-toast':
      showToast(button.dataset.message || 'Your preferences have been saved.');
      state.popover = null;
      break;
    case 'close-modal':
      closeModal();
      break;
    case 'backdrop-close':
      if (event.target === button) closeModal();
      break;
    default:
      break;
  }
}

document.addEventListener('click', (event) => {
  const actionElement = event.target.closest('[data-action]');
  if (actionElement) {
    handleAction(actionElement, event);
    return;
  }
  if (state.popover && !event.target.closest('.popover') && !event.target.closest('.header-action-wrap') && !event.target.closest('.profile-wrap')) {
    state.popover = null;
    renderApp();
  }
  if (state.searchOpen && !event.target.closest('.search-wrap')) {
    state.searchOpen = false;
    updateSearchResults();
  }
});

document.addEventListener('input', (event) => {
  if (event.target.id === 'login-phone') state.loginPhone = event.target.value.replace(/\D/g, '').slice(0, 10);
  if (event.target.id === 'login-otp') state.loginOtp = event.target.value.replace(/\D/g, '').slice(0, 6);
  if (event.target.id === 'global-search') {
    state.query = event.target.value;
    state.searchOpen = true;
    updateSearchResults();
  }
  if (event.target.id === 'material-search') {
    state.materialQuery = event.target.value;
    const selectionStart = event.target.selectionStart;
    renderApp();
    const next = document.getElementById('material-search');
    if (next) { next.focus(); next.setSelectionRange(selectionStart, selectionStart); }
  }
  if (event.target.id === 'admin-student-search') {
    state.adminStudentQuery = event.target.value;
    const selectionStart = event.target.selectionStart;
    renderApp();
    const next = document.getElementById('admin-student-search');
    if (next) { next.focus(); next.setSelectionRange(selectionStart, selectionStart); }
  }
});

document.addEventListener('focusin', (event) => {
  if (event.target.id === 'global-search') {
    state.searchOpen = true;
    updateSearchResults();
  }
});

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  const formData = new FormData(form);
  if (form.dataset.form === 'login-phone') {
    const phone = String(formData.get('phone') || '').replace(/\D/g, '').slice(-10);
    if (phone.length !== 10) {
      state.loginError = 'Enter a valid 10-digit Indian mobile number.';
      renderApp();
      return;
    }
    state.loginPhone = phone;
    state.loginError = '';
    state.loginBusy = true;
    renderApp();
    try {
      const result = await apiRequest('/api/auth/request-otp', { method: 'POST', body: { phone, role: state.loginRole } });
      state.demoOtp = result.demoOtp || '';
      state.loginStep = 'otp';
      state.loginOtp = '';
    } catch (error) {
      state.loginError = error.message;
    } finally {
      state.loginBusy = false;
      renderApp();
    }
    return;
  }
  if (form.dataset.form === 'login-otp') {
    const otp = String(formData.get('otp') || '').replace(/\D/g, '').slice(0, 6);
    if (otp.length !== 6) {
      state.loginError = 'Enter the 6-digit one-time code.';
      renderApp();
      return;
    }
    state.loginOtp = otp;
    state.loginError = '';
    state.loginBusy = true;
    renderApp();
    try {
      const result = await apiRequest('/api/auth/verify-otp', { method: 'POST', body: { phone: state.loginPhone, otp, role: state.loginRole } });
      state.sessionUser = result.user;
      state.role = result.user.role;
      state.view = state.role === 'admin' ? 'admin-overview' : 'overview';
      writeStore('dream-role', state.role);
      await hydrateWorkspace();
      state.authReady = true;
      state.demoOtp = '';
      state.loginError = '';
      renderApp();
      showToast(`Welcome to your ${state.role === 'admin' ? 'admin' : 'student'} workspace.`);
    } catch (error) {
      state.loginError = error.message;
      state.sessionUser = null;
      state.authReady = true;
    } finally {
      state.loginBusy = false;
      renderApp();
    }
    return;
  }
  if (form.dataset.form === 'doubt') {
    const title = String(formData.get('title') || '').trim();
    const body = String(formData.get('body') || '').trim();
    if (!title || !body) return;
    const questionBody = state.attachedFilename ? `${body} [Image attached: ${state.attachedFilename}]` : body;
    try {
      const result = await apiRequest('/api/student/doubts', { method: 'POST', body: { subject: String(formData.get('subject') || 'Physics'), title, body: questionBody } });
      state.customDoubts.unshift(result.item);
      writeStore('dream-doubts', state.customDoubts);
      state.attachedFilename = '';
      renderApp();
      showToast('Your doubt is in. A teacher will take a look soon.');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }
  if (form.dataset.form === 'community') {
    const text = String(formData.get('post') || '').trim();
    if (!text) return;
    try {
      const result = await apiRequest('/api/student/community', { method: 'POST', body: { text, subject: 'JEE 2027' } });
      state.customPosts.unshift(result.item);
      writeStore('dream-posts', state.customPosts);
      renderApp();
      showToast('Your post is live in the community.');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }
  if (form.dataset.form === 'admin-student') {
    const name = String(formData.get('name') || '').trim();
    if (!name) return;
    const initials = name.split(/\s+/).slice(0,2).map((part) => part[0]).join('').toUpperCase();
    try {
      const result = await apiRequest('/api/admin/students', { method: 'POST', body: { name, initials, grade: `${formData.get('grade')} · JEE`, batch: String(formData.get('batch') || 'New batch'), joined: 'Today', activity: 'Just joined', status: 'Active' } });
      state.adminStudents.unshift(result.item);
      writeStore('dream-admin-students', state.adminStudents);
      closeModal(); renderApp(); showToast(`${name} was added to the student list.`);
    } catch (error) { showToast(error.message, 'error'); }
  }
  if (form.dataset.form === 'admin-faculty') {
    const name = String(formData.get('name') || '').trim();
    if (!name) return;
    const initials = name.split(/\s+/).slice(0,2).map((part) => part[0]).join('').toUpperCase();
    try {
      const result = await apiRequest('/api/admin/faculty', { method: 'POST', body: { name, initials, subject: String(formData.get('subject')), batches: '1 batch', sessions: 'New faculty', status: 'Invited' } });
      state.adminFaculty.unshift(result.item);
      writeStore('dream-admin-faculty', state.adminFaculty);
      closeModal(); renderApp(); showToast(`${name} was added to faculty as an invite.`);
    } catch (error) { showToast(error.message, 'error'); }
  }
  if (form.dataset.form === 'admin-batch') {
    const name = String(formData.get('name') || '').trim();
    if (!name) return;
    try {
      const result = await apiRequest('/api/admin/batches', { method: 'POST', body: { name, grade: `${formData.get('grade')} · ${formData.get('exam')}`, students: 0, price: Number(formData.get('price') || 0), status: 'Draft', start: String(formData.get('start')), subjects: String(formData.get('subjects')) } });
      state.adminBatches.unshift(result.item);
      writeStore('dream-admin-batches', state.adminBatches);
      closeModal(); renderApp(); showToast(`${name} was created as a draft batch.`);
    } catch (error) { showToast(error.message, 'error'); }
  }
  if (form.dataset.form === 'admin-live') {
    const payload = { title: String(formData.get('title')).trim(), subject: String(formData.get('subject')), teacher: String(formData.get('teacher')), batch: String(formData.get('batch')), date: String(formData.get('date')), time: String(formData.get('time')), month: 'Scheduled', day: String(formData.get('date')).slice(-2), custom: true };
    try {
      const result = await apiRequest('/api/admin/classes', { method: 'POST', body: payload });
      state.adminScheduledClasses.unshift(result.item);
      writeStore('dream-admin-live', state.adminScheduledClasses);
      closeModal(); renderApp(); showToast('Live class added to the schedule.');
    } catch (error) { showToast(error.message, 'error'); }
  }
  if (form.dataset.form === 'admin-test') {
    const payload = { title: String(formData.get('title')).trim(), batch: String(formData.get('batch')), questions: Number(formData.get('questions') || 20), date: String(formData.get('date')), status: 'Draft', negative: String(formData.get('negative')) };
    try {
      const result = await apiRequest('/api/admin/tests', { method: 'POST', body: payload });
      state.adminTests.unshift(result.item);
      writeStore('dream-admin-tests', state.adminTests);
      closeModal(); renderApp(); showToast('Test saved as a draft.');
    } catch (error) { showToast(error.message, 'error'); }
  }
  if (form.dataset.form === 'admin-content') {
    const payload = { title: String(formData.get('title')).trim(), type: String(formData.get('type')), subject: String(formData.get('subject')), batch: String(formData.get('batch')), fileName: state.adminUploadName, date: `Added today${state.adminUploadName ? ` · ${state.adminUploadName}` : ''}`, status: 'Draft' };
    try {
      const result = await apiRequest('/api/admin/content', { method: 'POST', body: payload });
      state.adminContent.unshift(result.item);
      writeStore('dream-admin-content', state.adminContent);
      state.adminUploadName = '';
      renderApp(); showToast('Content metadata saved as a draft. Actual file storage is not connected.');
    } catch (error) { showToast(error.message, 'error'); }
  }
  if (form.dataset.form === 'admin-notification') {
    const timing = String(formData.get('timing'));
    const payload = { title: String(formData.get('title')).trim(), message: String(formData.get('message')).trim(), audience: String(formData.get('audience')), channel: String(formData.get('channel')), timing, status: timing === 'Send now' ? 'Sent' : 'Scheduled', date: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) };
    if (!payload.title || !payload.message) return;
    try {
      const result = await apiRequest('/api/admin/notifications', { method: 'POST', body: payload });
      state.adminNotifications.unshift(result.item);
      writeStore('dream-admin-notifications', state.adminNotifications);
      renderApp(); showToast(payload.timing === 'Send now' ? 'Notification saved to the local sent history.' : 'Notification saved to the local schedule.');
    } catch (error) { showToast(error.message, 'error'); }
  }
});

document.addEventListener('change', (event) => {
  if (event.target.id === 'doubt-image' && event.target.files?.[0]) {
    state.attachedFilename = event.target.files[0].name;
    renderApp();
  }
  if (event.target.id === 'admin-content-file' && event.target.files?.[0]) {
    state.adminUploadName = event.target.files[0].name;
    const name = document.getElementById('admin-upload-name');
    if (name) name.innerHTML = `${icon('file')}${escapeHTML(state.adminUploadName)}`;
  }
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    document.getElementById('global-search')?.focus();
  }
  if (event.key === 'Escape') {
    if (state.modal) closeModal();
    else if (state.popover || state.searchOpen) {
      state.popover = null;
      state.searchOpen = false;
      renderApp();
    } else if (state.mobileOpen) {
      state.mobileOpen = false;
      renderApp();
    }
  }
  if (state.modal?.type === 'quiz' && !state.quiz?.submitted && ['1','2','3','4'].includes(event.key)) {
    state.quiz.selected = Number(event.key) - 1;
    renderModal();
  }
});

async function initializeApp() {
  renderApp();
  try {
    const result = await apiRequest('/api/me');
    state.sessionUser = result.user;
    state.role = result.user.role;
    state.view = state.role === 'admin' ? 'admin-overview' : 'overview';
    await hydrateWorkspace();
  } catch {
    state.sessionUser = null;
  } finally {
    state.authReady = true;
    renderApp();
  }
}

initializeApp();
