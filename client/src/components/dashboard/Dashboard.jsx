import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import AuthContext from '../../contexts/AuthContext';
import SkeletonBlock, { Bar, StatCardsSkeleton, ListSkeleton } from '../Skeleton';
import {
  ArrowRight, Trophy, BookOpen, TrendingUp, Calendar, Layers, Bell, Building2, KeyRound,
  Flame, Target, Compass, BarChart2, Sparkles, Pin, NotebookPen, Dumbbell, Bookmark,
} from 'lucide-react';
import { Button, Card, CardHeader, StatCard, ProgressRing, EmptyState, ErrorState, Badge, DifficultyBadge } from '../ui';
import Achievements from './Achievements';
import { computeAchievements } from '../../utils/achievements';
import { percent, passedAttempt, scoreTone, TONE_TEXT, DEFAULT_PASS, computeStreak, categoryMeta, formatRelative } from '../../utils/quiz';

const BAR_FILL = { green: 'fill-emerald-500', amber: 'fill-amber-500', red: 'fill-red-500' };

/* Bar chart of recent scores with the pass line — plain SVG, no chart dependency */
const ScoreTrend = ({ attempts }) => {
  const W = 100, H = 48;
  const gap = 2;
  const w = (W - gap * (attempts.length - 1)) / attempts.length;
  const passY = H - (DEFAULT_PASS / 100) * H;
  return (
    <div className="flex gap-3">
      <div className="flex flex-col justify-between h-36 -my-1.5 text-[10px] leading-3 text-gray-400 tabular-nums" aria-hidden="true">
        <span>100</span><span>50</span><span>0</span>
      </div>
      <div className="flex-1">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-36" role="img"
          aria-label={`Scores for your last ${attempts.length} quizzes: ${attempts.map(percent).join('%, ')}%`}>
          {[0, 0.5, 1].map(f => (
            <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} className="stroke-gray-100 dark:stroke-gray-800" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
          ))}
          {attempts.map((a, i) => {
            const p = percent(a);
            const h = Math.max(1.5, (p / 100) * H);
            return (
              <rect key={a._id} x={i * (w + gap)} y={H - h} width={w} height={h} rx="1"
                className={`${BAR_FILL[scoreTone(p)]} opacity-85`}>
                <title>{`${a.quiz?.title || 'Quiz'} — ${p}%`}</title>
              </rect>
            );
          })}
          <line x1="0" x2={W} y1={passY} y2={passY} strokeDasharray="1.5 1.5" className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
          <span>Older</span>
          <span className="flex items-center gap-1.5"><span className="w-3 border-t border-dashed border-gray-400" /> {DEFAULT_PASS}% guide</span>
          <span>Latest</span>
        </div>
      </div>
    </div>
  );
};

const dueLabel = d => {
  if (!d) return null;
  const days = Math.ceil((new Date(d) - new Date()) / 86400000);
  if (days <= 0) return { text: 'Due today', tone: 'red' };
  if (days === 1) return { text: 'Due tomorrow', tone: 'amber' };
  if (days <= 3) return { text: `Due in ${days} days`, tone: 'amber' };
  return { text: `Due ${new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`, tone: 'gray' };
};

const Dashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [attempts,      setAttempts]      = useState([]);
  const [totalQuizzes,  setTotalQuizzes]  = useState(0);
  const [assignments,   setAssignments]   = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [catalogue,     setCatalogue]     = useState([]);
  const [mistakeCount,  setMistakeCount]  = useState(0);
  const [saved,         setSaved]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get('/quizzes/my-attempts'),
      api.get('/org/my-assignments').catch(() => ({ data: { assignments: [] } })),
      api.get('/org/announcements').catch(() => ({ data: { announcements: [] } })),
      api.get('/quizzes?limit=24').catch(() => ({ data: { quizzes: [] } })),
      api.get('/practice/mistakes').catch(() => ({ data: { total: 0 } })),
      api.get('/users/me/saved').catch(() => ({ data: { quizzes: [] } })),
    ]).then(([a, asgn, ann, q, mk, sv]) => {
      setAttempts(a.data.attempts || []);
      // Quizzes this user can actually take (platform + their organisation's)
      setTotalQuizzes(q.data.total ?? (q.data.quizzes || []).length);
      // Only show active (not expired, not future)
      setAssignments((asgn.data.assignments || []).filter(x => {
        if (x.dueDate && new Date(x.dueDate) < new Date()) return false;
        if (x.startDate && new Date(x.startDate) > new Date()) return false;
        return true;
      }));
      setAnnouncements(ann.data.announcements || []);
      setCatalogue(q.data.quizzes || []);
      setMistakeCount(mk.data.total || 0);
      setSaved(sv.data.quizzes || []);
    }).catch(() => setError('We couldn\'t load your dashboard. Check your connection and try again.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Oldest → newest, completed only
  const done = attempts
    .filter(a => a.completedAt)
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  const recentFirst = [...done].reverse();
  const scores = done.map(percent);
  const avg    = scores.length ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : 0;
  const best   = scores.length ? Math.max(...scores) : 0;
  const passed = done.filter(passedAttempt).length;
  const passRate = scores.length ? Math.round((passed / scores.length) * 100) : 0;
  const streak = computeStreak(done);

  // Last 5 vs the 5 before — a simple "are you improving" signal
  const last5 = scores.slice(-5);
  const prev5 = scores.slice(-10, -5);
  const delta = last5.length && prev5.length
    ? Math.round(last5.reduce((s, x) => s + x, 0) / last5.length - prev5.reduce((s, x) => s + x, 0) / prev5.length)
    : null;

  // Quizzes the user hasn't tried yet, preferring categories they already practise
  const attemptedIds = new Set(done.map(a => a.quiz?._id));
  const favCats = new Set(done.map(a => a.quiz?.category).filter(Boolean));
  const recommended = catalogue
    .filter(q => !attemptedIds.has(q._id))
    .sort((a, b) => (favCats.has(b.category) - favCats.has(a.category)) || ((b.totalAttempts || 0) - (a.totalAttempts || 0)))
    .slice(0, 4);

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = currentUser?.name?.split(' ')[0];

  if (loading) return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-7">
        <SkeletonBlock label="Loading your dashboard">
          <div className="space-y-7">
            <div className="space-y-2">
              <Bar className="h-3 w-28" />
              <Bar className="h-7 w-56" />
            </div>
            <StatCardsSkeleton />
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><ListSkeleton rows={4} /></div>
              <ListSkeleton rows={3} />
            </div>
          </div>
        </SkeletonBlock>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 px-4 py-10">
      <Card className="max-w-lg mx-auto"><ErrorState title="Dashboard unavailable" message={error} onRetry={load} /></Card>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">

        {/* Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{greeting},</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-0.5">{firstName}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
              {done.length === 0
                ? 'Take your first quiz to start tracking your progress.'
                : streak > 1
                  ? `You're on a ${streak}-day streak — keep it going today.`
                  : assignments.length
                    ? `You have ${assignments.length} assignment${assignments.length > 1 ? 's' : ''} waiting.`
                    : 'Pick up where you left off, or try something new.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button to="/progress" variant="secondary" icon={BarChart2}>Progress</Button>
            <Button to="/quizzes" icon={Compass}>Explore quizzes</Button>
          </div>
        </div>

        {/* Org onboarding — shown until the user sets up or joins an institute */}
        {!currentUser?.orgId && currentUser?.role === 'user' && (
          <Card className="flex flex-col md:flex-row md:items-center gap-5">
            <span className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">Studying with a coaching institute or school?</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Join your class with an invite code to get assignments and batch leaderboards — or set up your own institute.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Button to="/org/join" icon={KeyRound}>Join with code</Button>
              <Button to="/org/setup" variant="secondary">Set up institute</Button>
            </div>
          </Card>
        )}

        {/* Announcement banner */}
        {announcements.length > 0 && (
          <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl px-5 py-4">
            <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                {announcements[0].isPinned && <Pin className="h-3.5 w-3.5" aria-label="Pinned" />}
                {announcements[0].title}
              </p>
              <p className="text-sm text-amber-800/90 dark:text-amber-300/80 mt-0.5 line-clamp-2">{announcements[0].content}</p>
            </div>
            {announcements.length > 1 && (
              <Link to="/my-classes" className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline shrink-0 self-center">
                +{announcements.length - 1} more
              </Link>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Trophy}     label="Quizzes completed" value={done.length} hint={`of ${totalQuizzes} available`} />
          <StatCard icon={TrendingUp} label="Average score" value={`${avg}%`} tone="blue"
            hint={delta === null ? 'Across all attempts' : `${delta >= 0 ? '+' : ''}${delta}% vs earlier attempts`} />
          <StatCard icon={Target}     label="Best score" value={`${best}%`} tone="green" hint={best >= 90 ? 'Outstanding' : 'Personal best'} />
          <StatCard icon={Flame}      label="Day streak" value={streak} tone="amber" hint={streak ? 'Consecutive days practised' : 'Practise today to start one'} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">

          {/* ── Main column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Pending assignments */}
            {assignments.length > 0 && (
              <Card padding={false}>
                <CardHeader title="Up next" subtitle="Assigned by your institute" icon={Layers}
                  action={<Link to="/my-assignments" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">View all</Link>} />
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {assignments.slice(0, 3).map(a => {
                    const due = dueLabel(a.dueDate);
                    return (
                      <li key={a._id} className="flex items-center gap-4 px-5 sm:px-6 py-4">
                        <span className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: a.batch?.color || '#14a399' }} aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{a.quiz?.title}</p>
                          <div className="flex items-center flex-wrap gap-2 mt-1">
                            {a.batch?.name && <span className="text-xs text-gray-500 dark:text-gray-400">{a.batch.name}</span>}
                            {due && <Badge tone={due.tone} icon={Calendar}>{due.text}</Badge>}
                          </div>
                        </div>
                        <Button to={`/quiz/${a.quiz?._id}`} size="sm" iconRight={ArrowRight}>Start</Button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}

            {/* Score trend */}
            {done.length >= 2 ? (
              <Card>
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">Score trend</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Your last {Math.min(done.length, 12)} quizzes</p>
                  </div>
                  <Link to="/progress" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline shrink-0">Full report</Link>
                </div>
                <ScoreTrend attempts={done.slice(-12)} />
              </Card>
            ) : done.length === 0 && (
              <Card>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <span className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                    <Sparkles className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Start your first quiz</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Three steps to get going:</p>
                    <ol className="mt-4 space-y-2.5 text-sm text-gray-600 dark:text-gray-300">
                      {['Pick a topic you\'re preparing for.', 'Answer at your own pace — or beat the timer.', 'Review every answer and watch your scores improve here.'].map((t, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                          {t}
                        </li>
                      ))}
                    </ol>
                    <Button to="/quizzes" className="mt-5" iconRight={ArrowRight}>Browse quizzes</Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Recent activity */}
            <Card padding={false}>
              <CardHeader title="Recent activity"
                action={done.length > 0 && <Link to="/my-attempts" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">View all</Link>} />
              {done.length === 0 ? (
                <EmptyState compact icon={BookOpen} title="No attempts yet" description="Completed quizzes will show up here with your score." />
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {recentFirst.slice(0, 5).map(a => {
                    const score = percent(a);
                    const { icon: Icon, cls } = categoryMeta(a.quiz?.category);
                    return (
                      <li key={a._id}>
                        <Link to={`/attempts/${a._id}`}
                          className="group flex items-center gap-4 px-5 sm:px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.quiz?.title || 'Deleted quiz'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatRelative(a.completedAt)}{a.quiz?.category && ` · ${a.quiz.category}`}</p>
                          </div>
                          <span className={`text-sm font-bold tabular-nums ${TONE_TEXT[scoreTone(score)]}`}>{score}%</span>
                          <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-brand-500 shrink-0" aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          {/* ── Side column ── */}
          <div className="space-y-6">
            {mistakeCount > 0 && (
              <Card className="border-brand-200 dark:border-brand-500/30 bg-brand-50/60 dark:bg-brand-500/5">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-300 shadow-card flex items-center justify-center shrink-0">
                    <NotebookPen className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">{mistakeCount} question{mistakeCount === 1 ? '' : 's'} to fix</h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Your mistake notebook — get them right in practice to clear them.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button size="sm" icon={Dumbbell} to="/practice/mistakes">Drill now</Button>
                  <Button size="sm" variant="secondary" to="/mistakes">Review</Button>
                </div>
              </Card>
            )}

            <Card>
              <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">Pass rate</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Attempts that met each quiz's pass mark</p>
              <div className="flex items-center gap-5 mt-5">
                <ProgressRing value={passRate} size={104} stroke={9} tone={done.length ? scoreTone(passRate) : 'brand'} label={`Pass rate ${passRate}%`}>
                  <span className="text-xl font-bold font-display text-gray-900 dark:text-white tabular-nums">{passRate}%</span>
                </ProgressRing>
                <dl className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                    <dt className="text-gray-500 dark:text-gray-400">Passed</dt>
                    <dd className="font-semibold text-gray-900 dark:text-white tabular-nums ml-auto pl-3">{passed}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
                    <dt className="text-gray-500 dark:text-gray-400">Below pass</dt>
                    <dd className="font-semibold text-gray-900 dark:text-white tabular-nums ml-auto pl-3">{done.length - passed}</dd>
                  </div>
                </dl>
              </div>
            </Card>

            <Achievements achievements={computeAchievements(done)} compact />

            {saved.length > 0 && (
              <Card padding={false}>
                <CardHeader title="Saved for later" icon={Bookmark}
                  action={<Link to="/quizzes?view=saved" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">All {saved.length}</Link>} />
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {saved.slice(0, 3).map(q => (
                    <li key={q._id}>
                      <Link to={`/quiz/${q._id}`} className="group block px-5 sm:px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand-300 line-clamp-1">{q.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{q.category}{q.timeLimit > 0 && ` · ${q.timeLimit} min`}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card padding={false}>
              <CardHeader title="Recommended for you" subtitle={favCats.size ? 'Based on topics you practise' : 'Popular quizzes to try'} icon={Sparkles} />
              {recommended.length === 0 ? (
                <EmptyState compact icon={Trophy} title="You've tried everything!"
                  description="Retake a quiz to beat your best score." action={<Button to="/quizzes" size="sm" variant="secondary">Browse quizzes</Button>} />
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {recommended.map(q => (
                    <li key={q._id}>
                      <Link to={`/quiz/${q._id}`} className="group block px-5 sm:px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand-300 line-clamp-1">{q.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <DifficultyBadge difficulty={q.difficulty} />
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {q.category}{q.timeLimit > 0 && ` · ${q.timeLimit} min`}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
