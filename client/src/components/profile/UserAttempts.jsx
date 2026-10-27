import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import {
  Trophy, Search, X, ChevronRight, ArrowDownWideNarrow, ArrowUpNarrowWide,
  ListChecks, BarChart3, Target, Compass, SearchX, Clock,
} from 'lucide-react';
import { Page, PageHeader, Card, StatCard, Tabs, Button, EmptyState, ErrorState, inputClass } from '../ui';
import { SkeletonBlock, StatCardsSkeleton, ListSkeleton } from '../Skeleton';
import { percent, passedAttempt, scoreTone, categoryMeta, formatRelative, formatDuration } from '../../utils/quiz';

const PILL = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
  red:   'bg-red-50 text-red-700 ring-red-600/15 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20',
};

const SORTS = [
  { value: 'date',  label: 'Date' },
  { value: 'score', label: 'Score' },
  { value: 'title', label: 'Title' },
];

// Quiz-specific pass mark, falling back to the platform default (matches AttemptDetail)
const passed = passedAttempt;

const durationOf = a => (a.startedAt && a.completedAt ? (new Date(a.completedAt) - new Date(a.startedAt)) / 1000 : null);

const UserAttempts = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [sortBy,   setSortBy]   = useState('date');
  const [asc,      setAsc]      = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/quizzes/my-attempts')
      .then(r => setAttempts(r.data.attempts || []))
      .catch(err => setError(err.response?.data?.message || 'We could not load your attempts.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const sort = key => { if (sortBy === key) setAsc(a => !a); else { setSortBy(key); setAsc(false); } };

  const completed = attempts.filter(a => a.completedAt);
  const q = search.trim().toLowerCase();

  const rows = completed
    .filter(a => !q || (a.quiz?.title || '').toLowerCase().includes(q) || (a.quiz?.category || '').toLowerCase().includes(q))
    .sort((a, b) => {
      const d = sortBy === 'date'  ? new Date(b.completedAt) - new Date(a.completedAt)
              : sortBy === 'score' ? percent(b) - percent(a)
              : (a.quiz?.title || '').localeCompare(b.quiz?.title || '');
      return asc ? -d : d;
    });

  const avg  = completed.length ? Math.round(completed.reduce((s, a) => s + percent(a), 0) / completed.length) : 0;
  const pass = completed.length ? Math.round(completed.filter(passed).length / completed.length * 100) : 0;
  const best = completed.length ? Math.max(...completed.map(percent)) : 0;

  const header = (
    <PageHeader
      eyebrow="Your history"
      title="My attempts"
      description="Every quiz you have completed, with scores and a full answer review."
      actions={<Button to="/progress" variant="secondary" icon={BarChart3}>Progress report</Button>}
    />
  );

  if (loading) return (
    <Page width="md">
      {header}
      <SkeletonBlock label="Loading attempts">
        <div className="space-y-6">
          <StatCardsSkeleton count={4} />
          <ListSkeleton rows={6} />
        </div>
      </SkeletonBlock>
    </Page>
  );

  if (error) return (
    <Page width="md">
      {header}
      <Card><ErrorState title="Couldn't load your attempts" message={error} onRetry={load} /></Card>
    </Page>
  );

  if (completed.length === 0) return (
    <Page width="md">
      {header}
      <Card>
        <EmptyState
          icon={Trophy}
          title="No attempts yet"
          description="Finish a quiz and it will show up here with your score and a question-by-question review."
          action={<Button to="/quizzes" icon={Compass}>Explore quizzes</Button>}
        />
      </Card>
    </Page>
  );

  const DirIcon = asc ? ArrowUpNarrowWide : ArrowDownWideNarrow;
  const dirLabel = sortBy === 'date'
    ? (asc ? 'Oldest first' : 'Newest first')
    : sortBy === 'score' ? (asc ? 'Lowest first' : 'Highest first')
    : (asc ? 'Z to A' : 'A to Z');

  return (
    <Page width="md">
      {header}

      <div className="space-y-6 animate-fade-up">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={ListChecks} label="Completed"  value={completed.length} tone="brand" />
          <StatCard icon={BarChart3}  label="Avg score"  value={`${avg}%`}  tone="blue" />
          <StatCard icon={Target}     label="Pass rate"  value={`${pass}%`} tone="green" />
          <StatCard icon={Trophy}     label="Best score" value={`${best}%`} tone="amber" />
        </div>

        <Card padding={false}>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <div className="relative flex-1 min-w-0">
              <label htmlFor="attempt-search" className="sr-only">Search attempts</label>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
              <input
                id="attempt-search"
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title or category"
                className={`${inputClass} h-10 pl-10 pr-10 shadow-none [&::-webkit-search-cancel-button]:hidden`}
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Tabs label="Sort attempts by" options={SORTS} value={sortBy} onChange={sort} />
              <button type="button" onClick={() => setAsc(a => !a)}
                aria-label={`Sort direction: ${dirLabel}. Click to reverse.`} title={dirLabel}
                className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                <DirIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {q && (
            <p className="px-4 sm:px-5 pt-3 text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
              {rows.length} of {completed.length} attempts match "{search.trim()}"
            </p>
          )}

          {rows.length === 0 ? (
            <EmptyState
              compact
              icon={SearchX}
              title="No matching attempts"
              description="Try a different title or category."
              action={<Button variant="secondary" size="sm" onClick={() => setSearch('')}>Clear search</Button>}
            />
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map(a => {
                const score = percent(a);
                const tone  = scoreTone(score);
                const ok    = passed(a);
                const { icon: CatIcon, cls } = categoryMeta(a.quiz?.category);
                const secs  = durationOf(a);
                return (
                  <li key={a._id}>
                    <Link to={`/attempts/${a._id}`}
                      className="group flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors focus-visible:outline-none focus-visible:bg-gray-50 dark:focus-visible:bg-gray-800/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>
                        <CatIcon className="h-5 w-5" aria-hidden="true" />
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-brand-700 dark:group-hover:text-brand-300">
                          {a.quiz?.title || 'Unknown quiz'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex flex-wrap items-center gap-x-1.5">
                          <span>{formatRelative(a.completedAt)}</span>
                          {a.quiz?.category && <><span aria-hidden="true">·</span><span className="truncate">{a.quiz.category}</span></>}
                          {secs != null && secs >= 0 && (
                            <span className="hidden sm:inline-flex items-center gap-1">
                              <span aria-hidden="true">·</span><Clock className="h-3 w-3" aria-hidden="true" />{formatDuration(secs)}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-3 shrink-0">
                        <span className={`text-[11px] font-semibold uppercase tracking-wide ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {ok ? 'Passed' : 'Failed'}
                        </span>
                        <span className={`min-w-[3.25rem] text-center px-2 py-1 rounded-lg text-sm font-bold tabular-nums ring-1 ring-inset ${PILL[tone]}`}>
                          {score}%
                        </span>
                      </div>
                      <ChevronRight className="hidden sm:block h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 shrink-0" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </Page>
  );
};

export default UserAttempts;
