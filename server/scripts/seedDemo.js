// Demo data with one account per role, so every part of the UI can be tried locally.
// Loaded automatically by dev-mem-server.js (in-memory DB). Can also be run on its own
// against a LOCAL database:  node scripts/seedDemo.js
// It refuses non-local databases unless you pass --force — these accounts share a known password.
const mongoose     = require('mongoose');
const dotenv       = require('dotenv');
const User         = require('../models/user.model');
const Organization = require('../models/organization.model');
const Batch        = require('../models/batch.model');
const Assignment   = require('../models/assignment.model');
const Announcement = require('../models/announcement.model');
const Quiz         = require('../models/quiz.model');
const Question     = require('../models/question.model');
const Attempt      = require('../models/attempt.model');
const Review       = require('../models/review.model');

const DEMO_PASSWORD = 'Demo@1234';

// Shown on the login page in demo mode (see GET /api/dev/demo-accounts in index.js)
const DEMO_ACCOUNTS = [
  { key: 'admin',   role: 'admin',     name: 'Priya Admin',    email: 'admin@examvault.test',   label: 'Platform admin',        description: 'Manages every quiz, user, review and report.' },
  { key: 'owner',   role: 'org_admin', name: 'Rahul Verma',    email: 'owner@examvault.test',   label: 'Org admin (Apex Academy)', description: 'Owns Apex Academy, its batches and its quizzes.' },
  { key: 'other',   role: 'org_admin', name: 'Neha Kapoor',    email: 'other@examvault.test',   label: 'Org admin (Brightway School)', description: 'A different organisation — cannot edit Apex quizzes.' },
  { key: 'student', role: 'user',      name: 'Aarav Mehta',    email: 'student@examvault.test', label: 'Student in an org',     description: 'Apex Academy batch member with assignments and history.' },
  { key: 'learner', role: 'user',      name: 'Diya Rao',       email: 'learner@examvault.test', label: 'Independent learner',   description: 'No organisation — practises public quizzes.' },
];

// [title, category, difficulty, minutes, pass %, description, [[question, options, correctIndex], …]]
const PUBLIC_QUIZZES = [
  ['JavaScript Fundamentals', 'Programming', 'easy', 10, 60, 'Variables, types, scope and the everyday parts of JS that interviews love to ask about.', [
    ['Which keyword declares a block-scoped variable?', ['var', 'let', 'function', 'global'], 1],
    ['What does typeof null return?', ['"null"', '"undefined"', '"object"', '"number"'], 2],
    ['Which method adds an item to the end of an array?', ['push()', 'shift()', 'unshift()', 'pop()'], 0],
    ['What is the result of 0.1 + 0.2 === 0.3?', ['true', 'false', 'TypeError', 'NaN'], 1],
    ['Which of these is NOT a primitive?', ['string', 'symbol', 'object', 'bigint'], 2]]],
  ['Data Structures Essentials', 'Programming', 'medium', 15, 50, 'Stacks, queues, trees and Big-O — the core toolkit for placement coding rounds.', [
    ['Which structure is LIFO?', ['Queue', 'Stack', 'Heap', 'Graph'], 1],
    ['Average lookup time in a hash table?', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 0],
    ['Binary search requires the input to be…', ['Sorted', 'Unique', 'Linked', 'Hashed'], 0],
    ['Which traversal visits the root first?', ['In-order', 'Post-order', 'Pre-order', 'Level-order'], 2]]],
  ['Algebra Quick Check', 'Mathematics', 'easy', 8, 50, 'Linear equations, factorisation and indices — a warm-up before aptitude tests.', [
    ['Solve: 2x + 6 = 14', ['x = 3', 'x = 4', 'x = 5', 'x = 10'], 1],
    ['(a + b)² equals', ['a² + b²', 'a² + 2ab + b²', '2a + 2b', 'a² − b²'], 1],
    ['2³ × 2² =', ['2⁵', '2⁶', '4⁵', '2¹'], 0]]],
  ['Calculus for Engineers', 'Mathematics', 'hard', 20, 60, 'Limits, derivatives and integrals at first-year engineering level.', [
    ['d/dx (sin x) =', ['cos x', '−cos x', 'sin x', 'tan x'], 0],
    ['∫ 1/x dx =', ['ln|x| + C', 'x² + C', '1/x² + C', 'eˣ + C'], 0],
    ['lim (x→0) sin x / x =', ['0', '1', '∞', 'undefined'], 1]]],
  ['Physics: Motion & Forces', 'Science', 'medium', 12, 50, "Newton's laws, kinematics and units for NEET/JEE foundations.", [
    ['SI unit of force?', ['Joule', 'Newton', 'Watt', 'Pascal'], 1],
    ["F = ma is Newton's … law", ['First', 'Second', 'Third', 'Zeroth'], 1],
    ['Acceleration due to gravity near Earth ≈', ['8.9 m/s²', '9.8 m/s²', '10.8 m/s²', '1.6 m/s²'], 1]]],
  ['Modern Indian History', 'History', 'medium', 10, 40, 'Freedom struggle milestones that keep showing up in UPSC and state PSC prelims.', [
    ['The Dandi March began in', ['1919', '1930', '1942', '1947'], 1],
    ['Quit India Movement was launched in', ['1942', '1920', '1935', '1905'], 0]]],
  ['World Geography Basics', 'Geography', 'easy', 6, 40, 'Continents, rivers and capitals — fast recall practice.', [
    ['Longest river in the world (commonly cited)?', ['Amazon', 'Nile', 'Yangtze', 'Ganga'], 1],
    ['Capital of Australia?', ['Sydney', 'Melbourne', 'Canberra', 'Perth'], 2]]],
  ['Current Affairs & GK Sprint', 'General Knowledge', 'hard', 5, 70, 'A short, tough mixed-bag round to test your general awareness under time pressure.', [
    ['How many bits are in a byte?', ['4', '8', '16', '32'], 1],
    ['Which planet is known as the Red Planet?', ['Venus', 'Mars', 'Jupiter', 'Mercury'], 1]]],
];

const APEX_QUIZZES = [
  ['JEE Mock Test 1: Kinematics', 'Science', 'hard', 15, 50, 'Apex Academy weekly test — motion in one and two dimensions.', [
    ['A body starts from rest with a = 2 m/s². Distance covered in 5 s?', ['10 m', '25 m', '50 m', '5 m'], 1],
    ['Slope of a velocity–time graph gives', ['Displacement', 'Acceleration', 'Speed', 'Jerk'], 1],
    ['Range of a projectile is maximum at', ['30°', '45°', '60°', '90°'], 1]]],
  ['JEE Mock Test 2: Quadratics', 'Mathematics', 'medium', 12, 50, 'Apex Academy weekly test — roots, discriminant and graphs.', [
    ['Roots of x² − 5x + 6 = 0', ['2, 3', '1, 6', '−2, −3', '3, 4'], 0],
    ['If the discriminant is negative, the roots are', ['Real and equal', 'Real and distinct', 'Not real', 'Zero'], 2]]],
];

const BRIGHTWAY_QUIZZES = [
  ['Class 10 Science: Light', 'Science', 'easy', 10, 40, 'Brightway School unit test on reflection and refraction.', [
    ['Angle of incidence equals angle of', ['Refraction', 'Reflection', 'Deviation', 'Dispersion'], 1],
    ['Unit of power of a lens', ['Watt', 'Dioptre', 'Metre', 'Lux'], 1]]],
];

// Short explanations shown in answer reviews, practice mode and the mistake notebook
const EXPLANATIONS = {
  'Which keyword declares a block-scoped variable?': 'let (and const) are block-scoped; var is function-scoped and hoisted.',
  'What does typeof null return?': 'A long-standing JavaScript quirk: typeof null is "object", even though null is a primitive.',
  'Which method adds an item to the end of an array?': 'push() appends to the end; unshift() adds to the start, pop()/shift() remove.',
  'What is the result of 0.1 + 0.2 === 0.3?': 'Floating-point rounding makes 0.1 + 0.2 equal 0.30000000000000004, so the comparison is false.',
  'Which of these is NOT a primitive?': 'Objects are reference types; string, number, bigint, boolean, symbol, null and undefined are primitives.',
  'Which structure is LIFO?': 'A stack is Last-In-First-Out: the last item pushed is the first popped.',
  'Average lookup time in a hash table?': 'Hashing jumps straight to a bucket, giving O(1) average lookups (O(n) in the worst case).',
  'Binary search requires the input to be…': 'Binary search halves the range each step, which only works if the data is sorted.',
  'Which traversal visits the root first?': 'Pre-order visits root → left → right.',
  'Solve: 2x + 6 = 14': 'Subtract 6 from both sides (2x = 8), then divide by 2: x = 4.',
  '(a + b)² equals': '(a + b)(a + b) = a² + ab + ab + b² = a² + 2ab + b².',
  '2³ × 2² =': 'Same base, so add the exponents: 2³⁺² = 2⁵.',
  'd/dx (sin x) =': 'The derivative of sin x is cos x.',
  '∫ 1/x dx =': 'The antiderivative of 1/x is the natural log: ln|x| + C.',
  'lim (x→0) sin x / x =': 'A standard limit — it equals 1 (provable by the squeeze theorem).',
  'SI unit of force?': 'The newton (N) = 1 kg·m/s².',
  "F = ma is Newton's … law": "Newton's second law relates force, mass and acceleration.",
  'The Dandi March began in': 'Gandhi began the Salt March from Sabarmati on 12 March 1930.',
  'Quit India Movement was launched in': 'Launched on 8 August 1942 at the Bombay session of the AICC.',
  'Capital of Australia?': 'Canberra was purpose-built as a compromise between Sydney and Melbourne.',
};

const DAY = 86400000;

const isLocalUri = uri => /^mongodb:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/.test(uri || '');

async function createQuizzes(list, createdBy, organization) {
  const quizzes = [];
  for (const [title, category, difficulty, timeLimit, passScore, description, qs] of list) {
    const quiz = await Quiz.create({
      title, category, difficulty, timeLimit, passScore, description, createdBy, organization,
      isPublished: true, totalQuestions: qs.length,
    });
    const questions = await Question.insertMany(qs.map(([text, options, correct], order) => ({
      quizId: quiz._id, text, type: 'single', points: 1, order, explanation: EXPLANATIONS[text] || '',
      options: options.map((o, i) => ({ text: o, isCorrect: i === correct })),
    })));
    quizzes.push({ quiz, questions });
  }
  return quizzes;
}

// Records a completed attempt answering the first `correct` questions right and the rest wrong
async function attempt(user, { quiz, questions }, correct, daysAgo, seconds = 180) {
  const completedAt = new Date(Date.now() - daysAgo * DAY - Math.floor(Math.random() * 3) * 3600000);
  const answers = questions.map((q, i) => {
    const pick = i < correct ? q.options.find(o => o.isCorrect) : q.options.find(o => !o.isCorrect);
    return { questionId: q._id, selectedAnswer: pick.text, isCorrect: pick.isCorrect, pointsEarned: pick.isCorrect ? q.points : 0 };
  });
  const score = answers.reduce((s, a) => s + a.pointsEarned, 0);
  await Attempt.create({
    user: user._id, quiz: quiz._id, score, maxScore: questions.length,
    startedAt: new Date(completedAt.getTime() - seconds * 1000), completedAt, answers,
  });
  await Quiz.updateOne({ _id: quiz._id }, { $inc: { totalAttempts: 1 } });
}

/** Seeds into the current mongoose connection. Skips if the demo accounts already exist. */
async function seedDemo() {
  if (await User.exists({ email: DEMO_ACCOUNTS[0].email })) return { skipped: true };

  const users = {};
  for (const a of DEMO_ACCOUNTS) {
    users[a.key] = await User.create({ name: a.name, email: a.email, password: DEMO_PASSWORD, role: a.role });
  }

  const apex = await Organization.create({
    name: 'Apex Academy', type: 'tuition', contactEmail: users.owner.email, plan: 'pro',
    description: 'JEE/NEET coaching, Kota.', createdBy: users.owner._id, adminUsers: [users.owner._id],
  });
  const brightway = await Organization.create({
    name: 'Brightway School', type: 'school', contactEmail: users.other.email,
    description: 'CBSE school, Pune.', createdBy: users.other._id, adminUsers: [users.other._id],
  });

  const batch = await Batch.create({
    name: 'JEE 2027 Morning', subject: 'Physics & Maths', academicYear: '2026–27', color: '#0b847c',
    organization: apex._id, createdBy: users.owner._id, students: [users.student._id],
  });

  await User.updateOne({ _id: users.owner._id },   { orgId: apex._id });
  await User.updateOne({ _id: users.other._id },   { orgId: brightway._id });
  await User.updateOne({ _id: users.student._id }, { orgId: apex._id, batchIds: [batch._id] });

  const pub  = await createQuizzes(PUBLIC_QUIZZES, users.admin._id, null);
  const apx  = await createQuizzes(APEX_QUIZZES, users.owner._id, apex._id);
  await createQuizzes(BRIGHTWAY_QUIZZES, users.other._id, brightway._id);

  await Assignment.create([
    { quiz: apx[0].quiz._id, batch: batch._id, organization: apex._id, assignedBy: users.owner._id,
      instructions: 'Attempt in one sitting. Calculators not allowed.', dueDate: new Date(Date.now() + 2 * DAY), maxAttempts: 2 },
    { quiz: apx[1].quiz._id, batch: batch._id, organization: apex._id, assignedBy: users.owner._id,
      dueDate: new Date(Date.now() + 6 * DAY), maxAttempts: 1 },
    { quiz: pub[4].quiz._id, batch: batch._id, organization: apex._id, assignedBy: users.owner._id,
      startDate: new Date(Date.now() - 10 * DAY), dueDate: new Date(Date.now() - 1 * DAY), maxAttempts: 1 },
  ]);

  await Announcement.create({
    orgId: apex._id, createdBy: users.owner._id, isPinned: true,
    title: 'Mock Test 1 closes on Friday',
    content: 'Finish the Kinematics mock before the deadline — we will discuss solutions in Saturday\'s class.',
  });

  // History: a few days in a row for the student (so the streak shows), some spread out for the learner
  const s = users.student;
  await attempt(s, pub[0], 3, 9);
  await attempt(s, pub[2], 3, 7);
  await attempt(s, pub[1], 2, 5);
  await attempt(s, pub[4], 2, 3);
  await attempt(s, pub[0], 5, 2);
  await attempt(s, pub[6], 1, 1);
  await attempt(s, pub[3], 2, 0);

  const l = users.learner;
  await attempt(l, pub[0], 5, 4, 140);
  await attempt(l, pub[3], 3, 2, 420);
  await attempt(l, pub[5], 1, 1);
  await attempt(l, pub[7], 2, 0, 90);

  // Testimonials: three approved (shown on the home page) and one waiting in the admin's moderation queue
  await Review.create([
    { userId: users.student._id, name: users.student.name, role: 'JEE 2027 aspirant, Apex Academy', rating: 5, approved: true,
      quote: 'The timed mocks feel like the real exam, and the review after each attempt shows exactly which topics I keep missing.' },
    { userId: users.learner._id, name: users.learner.name, role: 'Final-year B.Tech student', rating: 5, approved: true,
      quote: 'I use it for placement prep — short programming and aptitude quizzes, and the streak keeps me practising every day.' },
    { userId: users.owner._id, name: users.owner.name, role: 'Director, Apex Academy', rating: 4, approved: true,
      quote: 'Assigning a test to a batch takes a minute, and the analytics tell me which students need help before the weekend class.' },
    { userId: users.other._id, name: users.other.name, role: 'Science teacher, Brightway School', rating: 5, approved: false,
      quote: 'Our class 10 unit tests moved online in a day. Students join with one invite code.' },
  ]);

  return { skipped: false, accounts: DEMO_ACCOUNTS.length };
}

module.exports = { seedDemo, DEMO_ACCOUNTS, DEMO_PASSWORD, isLocalUri };

// Standalone: node scripts/seedDemo.js [--force]
if (require.main === module) {
  dotenv.config();
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/examvault';
  if (!isLocalUri(uri) && !process.argv.includes('--force')) {
    console.error('Refusing to seed demo accounts (known password) into a non-local database. Pass --force if you really mean it.');
    process.exit(1);
  }
  mongoose.connect(uri)
    .then(seedDemo)
    .then(r => {
      console.log(r.skipped ? 'Demo data already present — nothing to do.' : `✅ Seeded ${r.accounts} demo accounts. Password for all: see DEMO_PASSWORD in this file.`);
      process.exit(0);
    })
    .catch(err => { console.error('Demo seed failed:', err); process.exit(1); });
}
