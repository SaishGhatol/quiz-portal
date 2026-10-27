import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { BookOpen, Clock, Calendar, RotateCcw, ArrowRight, ClipboardList, KeyRound, Compass, Lock, CalendarClock } from 'lucide-react';
import { Page, PageHeader, Badge, DifficultyBadge, Tabs, Button, Card, EmptyState, ErrorState } from '../ui';
import { SkeletonBlock, Bar } from '../Skeleton';
import { categoryMeta, formatDate, scoreTone, TONE_TEXT } from '../../utils/quiz';

// The server sends a status; fall back to working it out for older responses.
// A finished assignment reads "Completed" even after its due date has passed.
const SERVER_STATUS = { upcoming: 'upcoming', active: 'active', completed: 'done', expired: 'expired' };
const statusOf = a => {
  if (SERVER_STATUS[a.status]) return SERVER_STATUS[a.status];
  if (a.startDate && new Date(a.startDate) > new Date()) return 'upcoming';
  const pastDue = a.dueDate && new Date(a.dueDate) < new Date();
  if (a.attemptsLeft === 0 || (pastDue && a.attemptsUsed > 0)) return 'done';
  if (pastDue) return 'expired';
  return 'active';
};

const STATUS = {
  active:   { label: 'Active',    tone: 'green' },
  upcoming: { label: 'Upcoming',  tone: 'blue' },
  expired:  { label: 'Expired',   tone: 'gray' },
  done:     { label: 'Completed', tone: 'brand' },
};

const FILTERS = [['all', 'All'], ['active', 'Active'], ['upcoming', 'Upcoming'], ['done', 'Completed'], ['expired', 'Expired']];

const DAY = 86400000;
const startOfDay = d => { const x = new Date(d); return new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime(); };

// Calendar-day urgency for an open assignment's due date
const dueInfo = due => {
  const days = Math.round((startOfDay(due) - startOfDay(new Date())) / DAY);
  if (days <= 0) return { label: 'Due today',    tone: 'red' };
  if (days === 1) return { label: 'Due tomorrow', tone: 'amber' };
  if (days <= 3) return { label: `Due in ${days} days`, tone: 'amber' };
  return { label: `Due ${formatDate(due)}`, tone: null };
};

const Muted = ({ icon: Icon, children }) => (
  <span className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto h-10 px-4 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
    {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}{children}
  </span>
);

const AssignmentsSkeleton = () => (
  <SkeletonBlock label="Loading assignments">
    <Bar className="h-10 w-80 max-w-full rounded-xl mb-6" />
    <div className="space-y-3">
      {[0, 1, 2].map(i => (
        <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex gap-4">
          <Bar className="h-11 w-11 rounded-xl shrink-0" />
          <div className="flex-1">
            <div className="flex gap-2 mb-3"><Bar className="h-5 w-16 rounded-md" /><Bar className="h-5 w-14 rounded-md bg-gray-100 dark:bg-gray-800/60" /></div>
            <Bar className="h-4 w-2/3 mb-2" />
            <Bar className="h-3 w-1/2 bg-gray-100 dark:bg-gray-800/60" />
          </div>
          <Bar className="hidden sm:block h-10 w-24 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  </SkeletonBlock>
);

const MyAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [filter,      setFilter]      = useState('all');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/org/my-assignments')
      .then(r => setAssignments(r.data.assignments || []))
      .catch(err => setError(err.response?.data?.message || 'We could not load your assignments.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const withStatus = assignments.map(a => ({ a, status: statusOf(a) }));
  const counts = withStatus.reduce((acc, { status }) => ({ ...acc, [status]: (acc[status] || 0) + 1 }), {});
  const filtered = withStatus.filter(({ status }) => filter === 'all' || status === filter);

  const header = (
    <PageHeader
      eyebrow="Organisation"
      title="My assignments"
      description="Quizzes assigned to you by your organisation."
    />
  );

  if (loading) return <Page width="md">{header}<AssignmentsSkeleton /></Page>;

  if (error) return (
    <Page width="md">
      {header}
      <Card><ErrorState title="Couldn't load your assignments" message={error} onRetry={load} /></Card>
    </Page>
  );

  if (assignments.length === 0) return (
    <Page width="md">
      {header}
      <Card>
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          description="When your organisation assigns quizzes to your batch, they will appear here. Not part of an organisation yet? Join with the invite code your admin shared."
          action={<>
            <Button to="/org/join" icon={KeyRound}>Join with invite code</Button>
            <Button to="/quizzes" variant="secondary" icon={Compass}>Explore quizzes</Button>
          </>}
        />
      </Card>
    </Page>
  );

  return (
    <Page width="md">
      {header}

      <Tabs
        className="mb-6"
        label="Filter assignments by status"
        value={filter}
        onChange={setFilter}
        options={FILTERS.map(([value, label]) => ({ value, label, count: value === 'all' ? assignments.length : counts[value] || 0 }))}
      />

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            compact
            icon={BookOpen}
            title={`No ${FILTERS.find(f => f[0] === filter)?.[1].toLowerCase()} assignments`}
            description="Try a different filter."
            action={<Button variant="secondary" size="sm" onClick={() => setFilter('all')}>Show all</Button>}
          />
        </Card>
      ) : (
        <ul className="space-y-3 animate-fade-up">
          {filtered.map(({ a, status }) => {
            const st      = STATUS[status];
            const q       = a.quiz;
            const canTake = status === 'active';
            const due     = canTake && a.dueDate ? dueInfo(a.dueDate) : null;
            const { icon: CatIcon, cls } = categoryMeta(q?.category);

            return (
              <li key={a._id}
                className={`relative bg-white dark:bg-gray-900 border rounded-2xl shadow-card overflow-hidden transition-shadow ${
                  canTake
                    ? 'border-gray-200/80 dark:border-gray-800 hover:shadow-raised hover:border-brand-200 dark:hover:border-brand-500/40'
                    : 'border-gray-200/80 dark:border-gray-800'
                }`}>
                {/* Batch colour accent */}
                <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1"
                  style={{ backgroundColor: a.batch?.color || 'var(--color-brand-500)' }} />

                <div className="p-4 sm:p-5 pl-5 sm:pl-6 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex gap-3.5 sm:gap-4 flex-1 min-w-0">
                    <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>
                      <CatIcon className="h-5 w-5" aria-hidden="true" />
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <Badge tone={st.tone} dot>{st.label}</Badge>
                        {q?.difficulty && <DifficultyBadge difficulty={q.difficulty} />}
                        {due?.tone && <Badge tone={due.tone} icon={Clock}>{due.label}</Badge>}
                      </div>

                      <h3 className="font-semibold text-gray-900 dark:text-white leading-snug">{q?.title || 'Unknown quiz'}</h3>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex flex-wrap items-center gap-x-1.5">
                        {a.batch && (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.batch.color || 'var(--color-brand-500)' }} aria-hidden="true" />
                            {a.batch.name}
                          </span>
                        )}
                        {a.batch && q?.category && <span aria-hidden="true">·</span>}
                        {q?.category && <span>{q.category}</span>}
                      </p>

                      {/* Meta info */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        {q?.totalQuestions > 0 && (
                          <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" aria-hidden="true" />{q.totalQuestions} questions</span>
                        )}
                        {q?.timeLimit > 0 && (
                          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{q.timeLimit} min</span>
                        )}
                        {a.maxAttempts && (
                          <span className="inline-flex items-center gap-1">
                            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                            {typeof a.attemptsLeft === 'number'
                              ? `${a.attemptsLeft} of ${a.maxAttempts} attempt${a.maxAttempts !== 1 ? 's' : ''} left`
                              : `Max ${a.maxAttempts} attempt${a.maxAttempts !== 1 ? 's' : ''}`}
                          </span>
                        )}
                        {a.dueDate && !due?.tone && (
                          <span className={`inline-flex items-center gap-1 ${status === 'expired' ? TONE_TEXT.red : ''}`}>
                            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                            {new Date(a.dueDate) < new Date() ? 'Closed' : 'Due'} {formatDate(a.dueDate)}
                          </span>
                        )}
                        {a.startDate && status === 'upcoming' && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                            Opens {formatDate(a.startDate)}
                          </span>
                        )}
                        {typeof (a.bestScore ?? a.lastScore) === 'number' && (
                          <span className={`font-semibold ${TONE_TEXT[scoreTone(a.bestScore ?? a.lastScore)] || ''}`}>
                            Best score {a.bestScore ?? a.lastScore}%
                            {a.attemptsUsed > 1 && typeof a.lastScore === 'number' && a.lastScore !== a.bestScore && (
                              <span className="font-normal text-gray-500 dark:text-gray-400"> · last {a.lastScore}%</span>
                            )}
                          </span>
                        )}
                      </div>

                      {a.instructions && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                          {a.instructions}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="shrink-0 sm:pl-2">
                    {canTake ? (
                      <Button to={`/quiz/${q?._id}`} iconRight={ArrowRight} className="w-full sm:w-auto">
                        {a.attemptsUsed > 0 ? 'Retake quiz' : 'Start quiz'}
                      </Button>
                    ) : status === 'upcoming' ? (
                      <Muted icon={Lock}>Not open yet</Muted>
                    ) : status === 'done' ? (
                      <Muted>{a.attemptsLeft > 0 ? 'Closed' : 'No attempts left'}</Muted>
                    ) : (
                      <Muted>Expired</Muted>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
};

export default MyAssignments;
