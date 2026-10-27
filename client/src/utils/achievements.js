import { Footprints, Rocket, Medal, Star, Zap, Flame, CalendarCheck, Compass, Library, TrendingUp } from 'lucide-react';
import { percent } from './quiz';

const dayKey = d => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`; };

// Longest run of consecutive days with at least one completed quiz
const longestStreak = attempts => {
  const days = [...new Set(attempts.map(a => dayKey(a.completedAt)))]
    .map(k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m, d).getTime(); })
    .sort((a, b) => a - b);
  let best = 0, run = 0, prev = null;
  for (const t of days) {
    run = prev !== null && Math.round((t - prev) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
};

// Biggest jump between a first and a later attempt on the same quiz, in points
const bestImprovement = attempts => {
  const byQuiz = {};
  [...attempts].sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt)).forEach(a => {
    const id = a.quiz?._id || a.quiz;
    if (!id) return;
    (byQuiz[id] = byQuiz[id] || []).push(percent(a));
  });
  return Object.values(byQuiz).reduce((best, s) => Math.max(best, s.length > 1 ? Math.max(...s.slice(1)) - s[0] : 0), 0);
};

/**
 * Badges earned from completed attempts. Each has a target and current progress,
 * so locked ones can show how close you are.
 */
export const computeAchievements = rawAttempts => {
  const attempts = rawAttempts.filter(a => a.completedAt);
  const scores = attempts.map(percent);
  const categories = new Set(attempts.map(a => a.quiz?.category).filter(Boolean));
  const streak = longestStreak(attempts);
  const improvement = bestImprovement(attempts);

  const list = [
    { id: 'first',     icon: Footprints,    title: 'First steps',   desc: 'Complete your first quiz',               current: attempts.length, target: 1 },
    { id: 'five',      icon: Rocket,        title: 'Warming up',    desc: 'Complete 5 quizzes',                     current: attempts.length, target: 5 },
    { id: 'twentyfive',icon: Library,       title: 'Dedicated',     desc: 'Complete 25 quizzes',                    current: attempts.length, target: 25 },
    { id: 'perfect',   icon: Star,          title: 'Perfect score', desc: 'Score 100% on a quiz',                   current: scores.filter(s => s === 100).length, target: 1 },
    { id: 'high',      icon: Medal,         title: 'High flyer',    desc: 'Score 90% or more three times',          current: scores.filter(s => s >= 90).length, target: 3 },
    { id: 'streak3',   icon: Flame,         title: 'On a roll',     desc: 'Practise 3 days in a row',               current: streak, target: 3 },
    { id: 'streak7',   icon: CalendarCheck, title: 'Week warrior',  desc: 'Practise 7 days in a row',               current: streak, target: 7 },
    { id: 'explorer',  icon: Compass,       title: 'Explorer',      desc: 'Take quizzes in 3 different topics',     current: categories.size, target: 3 },
    { id: 'comeback',  icon: TrendingUp,    title: 'Comeback',      desc: 'Improve a quiz score by 30+ points on a retake', current: improvement, target: 30, unit: 'pts' },
    { id: 'speed',     icon: Zap,           title: 'Quick thinker', desc: 'Pass a timed quiz in under a quarter of its time limit',
      current: attempts.some(a => percent(a) >= (a.quiz?.passScore ?? 40) && a.quiz?.timeLimit
        && (new Date(a.completedAt) - new Date(a.startedAt)) / 1000 < a.quiz.timeLimit * 15) ? 1 : 0, target: 1 },
  ];

  return list.map(a => ({ ...a, earned: a.current >= a.target, progress: Math.min(1, a.current / a.target) }));
};
