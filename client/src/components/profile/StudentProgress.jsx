import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { TrendingUp, Trophy, Target, BarChart3, Flame, Compass, ArrowRight, ChevronRight, LineChart, Crosshair } from 'lucide-react';
import Achievements from '../dashboard/Achievements';
import { computeAchievements } from '../../utils/achievements';
import { Page, PageHeader, Card, CardHeader, StatCard, ProgressBar, Button, EmptyState, ErrorState } from '../ui';
import { SkeletonBlock, StatCardsSkeleton, ListSkeleton, Bar } from '../Skeleton';
import { percent, passedAttempt, scoreTone, TONE_TEXT, categoryMeta, computeStreak, formatDate, formatRelative, DEFAULT_PASS } from '../../utils/quiz';

const PILL = {
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  red:   'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

const Y_TICKS = [100, 50, 0];

/*
 * Dependency-free score chart. The SVG stretches to the container (non-scaling
 * strokes keep lines crisp); labels and points are HTML so text never distorts.
 */
const ScoreChart = ({ values, dates }) => {
  const n = values.length;
  const x = i => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const y = v => 100 - Math.max(0, Math.min(100, v));
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
  const area = `${line} L${x(n - 1)},100 L${x(0)},100 Z`;
  const showDots = n <= 30;
  const avg = Math.round(values.reduce((s, v) => s + v, 0) / n);

  return (
    <div>
      <div className="relative h-48 sm:h-56 pl-9"
        role="img"
        aria-label={`Score over time across ${n} attempts: first ${values[0]}%, latest ${values[n - 1]}%, average ${avg}%. Pass mark ${DEFAULT_PASS}%.`}>
        {/* Y axis labels */}
        {Y_TICKS.map(t => (
          <span key={t} aria-hidden="true"
            className="absolute left-0 w-7 text-right text-[11px] tabular-nums text-gray-400 dark:text-gray-500 -translate-y-1/2"
            style={{ top: `${y(t)}%` }}>
            {t}
          </span>
        ))}

        <div className="relative h-full" aria-hidden="true">
          {/* Grid lines */}
          {Y_TICKS.map(t => (
            <div key={t} className="absolute inset-x-0 border-t border-gray-100 dark:border-gray-800" style={{ top: `${y(t)}%` }} />
          ))}

          {/* Pass line */}
          <div className="absolute inset-x-0 border-t border-dashed border-emerald-500/60" style={{ top: `${y(DEFAULT_PASS)}%` }}>
            <span className="absolute right-0 top-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 bg-white/80 dark:bg-gray-900/80 px-1 rounded">
              Pass {DEFAULT_PASS}%
            </span>
          </div>

          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible text-brand-500 dark:text-brand-400">
            <path d={area} fill="currentColor" fillOpacity="0.1" />
            <path d={line} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>

          {values.map((v, i) => (showDots || i === n - 1) && (
            <span key={i} title={`${v}% · ${formatDate(dates[i])}`}
              className={`absolute rounded-full -translate-x-1/2 -translate-y-1/2 ring-2 ring-white dark:ring-gray-900 ${
                i === n - 1 ? 'w-3 h-3 bg-brand-600 dark:bg-brand-400' : 'w-2 h-2 bg-brand-500 dark:bg-brand-400'
              }`}
              style={{ left: `${x(i)}%`, top: `${y(v)}%` }} />
          ))}
        </div>
      </div>

      <div className="flex justify-between pl-9 mt-2 text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
        <span>{formatDate(dates[0])}</span>
        <span>{formatDate(dates[n - 1])}</span>
      </div>
    </div>
  );
};

const StudentProgress = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/quizzes/my-attempts')
      .then(r => setAttempts(r.data.attempts || []))
      .catch(err => setError(err.response?.data?.message || 'We could not load your progress.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const done = attempts.filter(a => a.completedAt).sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

  const scores = done.map(percent);
  const avg    = scores.length ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : 0;
  const best   = scores.length ? Math.max(...scores) : 0;
  const pass   = done.filter(passedAttempt).length;
  const streak = computeStreak(attempts);

  // Attempts per category
  const byCategory = done.reduce((acc, a) => {
    const cat = a.quiz?.category || 'Uncategorised';
    acc[cat] = acc[cat] || { name: cat, count: 0, totalPct: 0 };
    acc[cat].count++;
    acc[cat].totalPct += percent(a);
    return acc;
  }, {});

  const categories = Object.values(byCategory)
    .map(c => ({ ...c, avg: Math.round(c.totalPct / c.count) }))
    .sort((a, b) => b.count - a.count);

  // Lowest average wins; ties go to the category with more attempts (more signal)
  const weakest = categories
    .filter(c => c.name !== 'Uncategorised')
    .reduce((w, c) => (!w || c.avg < w.avg || (c.avg === w.avg && c.count > w.count) ? c : w), null);

  const header = (
    <PageHeader
      eyebrow="Insights"
      title="Progress report"
      description="How your scores are trending and where to focus next."
      actions={done.length > 0 && <Button to="/my-attempts" variant="secondary">All attempts</Button>}
    />
  );

  if (loading) return (
    <Page>
      {header}
      <SkeletonBlock label="Loading progress">
        <div className="space-y-6">
          <StatCardsSkeleton count={4} />
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <Bar className="h-4 w-32 mb-6" />
            <Bar className="h-48 w-full bg-gray-100 dark:bg-gray-800/60" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ListSkeleton rows={4} />
            <ListSkeleton rows={4} />
          </div>
        </div>
      </SkeletonBlock>
    </Page>
  );

  if (error) return (
    <Page>
      {header}
      <Card><ErrorState title="Couldn't load your progress" message={error} onRetry={load} /></Card>
    </Page>
  );

  if (done.length === 0) return (
    <Page>
      {header}
      <Card>
        <EmptyState
          icon={TrendingUp}
          title="Your progress starts with one quiz"
          description="Complete a quiz to see score trends, category strengths and a suggestion for what to practise next."
          action={<Button to="/quizzes" icon={Compass}>Explore quizzes</Button>}
        />
      </Card>
    </Page>
  );

  const latest = scores[scores.length - 1];
  const prev   = scores.length >= 2 ? scores[scores.length - 2] : null;
  const delta  = prev == null ? null : latest - prev;

  return (
    <Page>
      {header}

      <div className="space-y-6 animate-fade-up">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={BarChart3} label="Average score" value={`${avg}%`} hint={`${pass} of ${done.length} passed`} tone="brand" />
          <StatCard icon={Trophy}    label="Best score"    value={`${best}%`} tone="amber" />
          <StatCard icon={Target}    label="Quizzes done"  value={done.length} tone="green" />
          <StatCard icon={Flame}     label="Current streak" value={`${streak} day${streak === 1 ? '' : 's'}`}
            hint={streak > 0 ? 'Keep it going today' : 'Take a quiz to start one'} tone="red" />
        </div>

        {/* Focus next */}
        {weakest && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-brand-100 dark:border-brand-500/20 bg-brand-50/60 dark:bg-brand-500/[0.07] p-4 sm:p-5">
            <span className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-brand-100 dark:border-brand-500/20 flex items-center justify-center shrink-0">
              <Crosshair className="h-5 w-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Focus next: {weakest.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {categories.filter(c => c.name !== 'Uncategorised').length > 1
                  ? <>Your average here is <span className={`font-semibold ${TONE_TEXT[scoreTone(weakest.avg)]}`}>{weakest.avg}%</span>, your lowest category.</>
                  : <>You average <span className={`font-semibold ${TONE_TEXT[scoreTone(weakest.avg)]}`}>{weakest.avg}%</span> here. Try another category to compare.</>}
              </p>
            </div>
            <Button to={`/quizzes?category=${encodeURIComponent(weakest.name)}`} iconRight={ArrowRight} className="w-full sm:w-auto">
              Practise {weakest.name}
            </Button>
          </div>
        )}

        {/* Score over time */}
        <Card padding={false}>
          <CardHeader
            icon={LineChart}
            title="Score over time"
            subtitle={`${scores.length} attempt${scores.length === 1 ? '' : 's'}`}
            action={delta != null && (
              <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                Latest <span className={`font-semibold ${TONE_TEXT[scoreTone(latest)]}`}>{latest}%</span>
                <span className={`ml-1.5 font-medium ${delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : delta < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              </span>
            )}
          />
          <div className="p-5 sm:p-6">
            {scores.length >= 2 ? (
              <ScoreChart values={scores} dates={done.map(a => a.completedAt)} />
            ) : (
              <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                Complete one more quiz to see your trend line.
              </p>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category performance */}
          <Card padding={false}>
            <CardHeader title="By category" subtitle="Average score per subject" />
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {categories.map(c => {
                const tone = scoreTone(c.avg);
                const { icon: CatIcon, cls } = categoryMeta(c.name);
                return (
                  <li key={c.name} className="flex items-center gap-3 px-5 sm:px-6 py-3.5">
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cls}`}>
                      <CatIcon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-1.5">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name}</span>
                        <span className={`text-sm font-semibold tabular-nums shrink-0 ${TONE_TEXT[tone]}`}>{c.avg}%</span>
                      </div>
                      <ProgressBar value={c.avg} tone={tone} size="sm" label={`${c.name} average ${c.avg}%`} />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                        {c.count} quiz{c.count !== 1 ? 'zes' : ''}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Recent results */}
          <Card padding={false}>
            <CardHeader
              title="Recent results"
              action={<Link to="/my-attempts" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">See all</Link>}
            />
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {[...done].reverse().slice(0, 6).map(a => {
                const score = percent(a);
                return (
                  <li key={a._id}>
                    <Link to={`/attempts/${a._id}`}
                      className="group flex items-center gap-3 px-5 sm:px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500">
                      <span className={`min-w-[3.25rem] text-center px-2 py-1 rounded-lg text-sm font-bold tabular-nums shrink-0 ${PILL[scoreTone(score)]}`}>
                        {score}%
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.quiz?.title || 'Quiz'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatRelative(a.completedAt)}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 shrink-0" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>

      <section id="achievements" className="mt-6 scroll-mt-24">
        <Achievements achievements={computeAchievements(done)} />
      </section>
    </Page>
  );
};

export default StudentProgress;
