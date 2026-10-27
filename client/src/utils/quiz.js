import { Code2, FlaskConical, Sigma, Landmark, Globe2, Lightbulb, BookOpen } from 'lucide-react';

// Shared quiz/attempt helpers so every page scores, labels and colours things the same way

export const percent = a => (a?.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : 0);

// Pass mark used when a quiz does not define its own
export const DEFAULT_PASS = 40;

// Passed against the quiz's own pass mark when the attempt carries it
export const passedAttempt = a => percent(a) >= (a?.quiz?.passScore ?? DEFAULT_PASS);

export const scoreTone = pct => (pct >= 70 ? 'green' : pct >= DEFAULT_PASS ? 'amber' : 'red');

export const TONE_TEXT = {
  green: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  red:   'text-red-600 dark:text-red-400',
};

export const DIFFICULTY = {
  easy:   { label: 'Easy',   tone: 'green' },
  medium: { label: 'Medium', tone: 'amber' },
  hard:   { label: 'Hard',   tone: 'red' },
};

export const difficultyOf = d => DIFFICULTY[(d || '').toLowerCase()] || { label: d || 'Mixed', tone: 'gray' };

export const CATEGORIES = ['Programming', 'Science', 'Mathematics', 'History', 'Geography', 'General Knowledge'];

const CATEGORY_META = {
  'Programming':       { icon: Code2,        cls: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400' },
  'Science':           { icon: FlaskConical, cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  'Mathematics':       { icon: Sigma,        cls: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400' },
  'History':           { icon: Landmark,     cls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  'Geography':         { icon: Globe2,       cls: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' },
  'General Knowledge': { icon: Lightbulb,    cls: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' },
};

export const categoryMeta = c =>
  CATEGORY_META[c] || { icon: BookOpen, cls: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' };

// 754 → "12m 34s", 45 → "45s"
export const formatDuration = seconds => {
  if (seconds == null || isNaN(seconds) || seconds < 0) return '—';
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
};

export const formatDate = d =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// "Today", "Yesterday", "3 days ago", then a plain date
export const formatRelative = d => {
  if (!d) return '';
  const day = 86400000;
  const startOf = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(new Date()) - startOf(new Date(d))) / day);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return formatDate(d);
};

const dayKey = d => {
  const x = new Date(d);
  return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
};

// Consecutive days (ending today, or yesterday if nothing yet today) with a completed attempt
export const computeStreak = attempts => {
  const days = new Set(attempts.filter(a => a.completedAt).map(a => dayKey(a.completedAt)));
  if (!days.size) return 0;
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

// Best completed attempt per quiz id, for "you scored X%" hints on quiz cards
export const bestByQuiz = attempts =>
  attempts.reduce((acc, a) => {
    const id = a.quiz?._id || a.quiz;
    if (!id || !a.completedAt) return acc;
    const p = percent(a);
    if (!(id in acc) || p > acc[id]) acc[id] = p;
    return acc;
  }, {});
