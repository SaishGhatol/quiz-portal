import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../../utils/api';
import AuthContext from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import {
  Clock, CheckCircle2, AlertCircle, ArrowRight, Layers, Building2, KeyRound, Compass, RotateCcw, CalendarClock, Lock,
} from 'lucide-react';
import { Page, PageHeader, Card, StatCard, Tabs, Badge, DifficultyBadge, Button, EmptyState, ErrorState } from '../ui';
import { SkeletonBlock, Bar } from '../Skeleton';
import { categoryMeta, scoreTone, formatDate, TONE_TEXT } from '../../utils/quiz';

// upcoming | active | completed | expired — sent by the server, derived here for older responses
const statusOf = a => {
  if (a.status) return a.status;
  if (a.startDate && new Date(a.startDate) > new Date()) return 'upcoming';
  const pastDue = a.dueDate && new Date(a.dueDate) < new Date();
  if (a.attemptsLeft === 0 || (pastDue && a.attemptsUsed > 0)) return 'completed';
  return pastDue ? 'expired' : 'active';
};

/* Countdown badge */
const TimeLeft = ({ dueDate }) => {
  if (!dueDate) return null;
  const ms = new Date(dueDate) - new Date();
  if (ms < 0) return <Badge tone="red" icon={AlertCircle}>Overdue</Badge>;
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(h / 24);
  const tone = d < 1 ? 'red' : d < 3 ? 'amber' : 'gray';
  return <Badge tone={tone} icon={Clock}>{d > 0 ? `${d}d left` : `${h}h left`}</Badge>;
};

/* Single assignment card */
const AssignmentCard = ({ asgn }) => {
  const status   = statusOf(asgn);
  const done     = asgn.attemptsUsed > 0;
  const overdue  = status === 'expired';
  const upcoming = status === 'upcoming';
  const score    = asgn.bestScore ?? asgn.lastScore;
  const { icon: CatIcon, cls } = categoryMeta(asgn.quiz?.category);

  return (
    <div className={`relative bg-white dark:bg-gray-900 border rounded-2xl shadow-card overflow-hidden flex flex-col transition-shadow hover:shadow-raised ${
      overdue ? 'border-red-200 dark:border-red-500/30'
      : done   ? 'border-emerald-200 dark:border-emerald-500/30'
               : 'border-gray-200/80 dark:border-gray-800'
    }`}>
      {/* Batch colour strip */}
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: asgn.batch?.color || 'var(--color-brand-500)' }} aria-hidden="true" />

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>
            <CatIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          {done && <Badge tone="green" icon={CheckCircle2}>Completed</Badge>}
          {overdue && !done && <Badge tone="red" icon={AlertCircle}>Overdue</Badge>}
          {upcoming && <Badge tone="blue" icon={CalendarClock}>Upcoming</Badge>}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5 min-w-0">
          <Layers className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{asgn.batch?.name || 'Batch'}</span>
        </p>
        <h3 className="font-semibold text-gray-900 dark:text-white leading-snug mb-3">
          {asgn.title || asgn.quiz?.title}
        </h3>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {asgn.quiz?.difficulty && <DifficultyBadge difficulty={asgn.quiz.difficulty} />}
          {asgn.quiz?.category && <Badge>{asgn.quiz.category}</Badge>}
          {asgn.quiz?.timeLimit > 0 && <Badge icon={Clock}>{asgn.quiz.timeLimit}m</Badge>}
          {asgn.dueDate && !overdue && !upcoming && status !== 'completed' && <TimeLeft dueDate={asgn.dueDate} />}
        </div>

        {/* Attempts remaining */}
        <div className="flex items-center justify-between gap-2 text-xs mb-3">
          <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            {asgn.attemptsLeft} of {asgn.maxAttempts} attempt{asgn.maxAttempts !== 1 ? 's' : ''} left
          </span>
          {done && score != null && (
            <span className={`font-semibold tabular-nums ${TONE_TEXT[scoreTone(score)]}`}>
              Best {score}%
            </span>
          )}
        </div>

        {/* Instructions */}
        {asgn.instructions && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
            {asgn.instructions}
          </p>
        )}

        {/* CTA */}
        <div className="mt-auto pt-2">
          {asgn.canAttempt ? (
            <Button to={`/quiz/${asgn.quiz?._id}`} variant={done ? 'secondary' : 'primary'} iconRight={ArrowRight} fullWidth>
              {done ? 'Retake quiz' : 'Start quiz'}
            </Button>
          ) : upcoming ? (
            <Button disabled variant="secondary" icon={Lock} fullWidth>Opens {formatDate(asgn.startDate)}</Button>
          ) : (
            <Button disabled variant="secondary" fullWidth>{asgn.attemptsLeft > 0 ? 'Closed' : 'No attempts left'}</Button>
          )}
        </div>
      </div>
    </div>
  );
};

const ClassesSkeleton = () => (
  <SkeletonBlock label="Loading classes">
    <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-7">
      {[0, 1, 2].map(i => (
        <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-5">
          <Bar className="h-3 w-16 mb-3 bg-gray-100 dark:bg-gray-800/60" /><Bar className="h-6 w-10" />
        </div>
      ))}
    </div>
    <Bar className="h-10 w-80 max-w-full rounded-xl mb-6" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2].map(i => (
        <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <Bar className="h-10 w-10 rounded-xl mb-4" />
          <Bar className="h-3 w-20 mb-2 bg-gray-100 dark:bg-gray-800/60" />
          <Bar className="h-4 w-3/4 mb-4" />
          <Bar className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  </SkeletonBlock>
);

/* ─── Main page ───────────────────────────────────────────────────────────── */
const MyClasses = () => {
  const { currentUser }    = useContext(AuthContext);
  const { org }            = useOrg();
  const [assignments, setAssignments] = useState([]);
  const [batches,     setBatches]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [activeTab,   setActiveTab]   = useState('pending');

  const orgId = currentUser?.orgId;

  const load = useCallback(() => {
    // Only fetch if user has an org
    if (!orgId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    Promise.all([
      api.get('/org/my-assignments'),
      api.get('/org/batches'),
    ]).then(([a, b]) => {
      setAssignments(a.data.assignments || []);
      setBatches(b.data.batches || []);
    }).catch(err => setError(err.response?.data?.message || 'We could not load your classes.'))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  // Open and not started → pending; any attempt made → completed; closed untouched → overdue
  const pending   = assignments.filter(a => statusOf(a) === 'active' && !a.attemptsUsed);
  const completed = assignments.filter(a => statusOf(a) === 'completed' || (statusOf(a) === 'active' && a.attemptsUsed > 0));
  const overdue   = assignments.filter(a => statusOf(a) === 'expired');
  const upcoming  = assignments.filter(a => statusOf(a) === 'upcoming');

  /* User hasn't joined any organisation */
  if (!orgId) {
    return (
      <Page width="sm" className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <Card className="w-full text-center py-10 sm:py-12">
          <span className="inline-flex items-center justify-center w-14 h-14 bg-brand-50 dark:bg-brand-500/10 rounded-2xl mb-5">
            <Building2 className="h-7 w-7 text-brand-600 dark:text-brand-400" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Join an organisation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Ask your teacher or admin for the invite code to access your class assignments.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-2">
            <Button to="/org/join" icon={KeyRound} size="lg">Join with invite code</Button>
            <Button to="/quizzes" variant="ghost" size="lg">Explore quizzes</Button>
          </div>
        </Card>
      </Page>
    );
  }

  const header = (
    <PageHeader
      eyebrow={org?.name || 'Classes'}
      title="My classes"
      description={org ? <>Quizzes assigned by <span className="font-medium text-gray-700 dark:text-gray-300">{org.name}</span></> : 'Your assigned quizzes'}
      actions={<Button to="/quizzes" variant="secondary" icon={Compass}>Explore quizzes</Button>}
    />
  );

  if (loading) return <Page>{header}<ClassesSkeleton /></Page>;

  if (error) return (
    <Page>
      {header}
      <Card><ErrorState title="Couldn't load your classes" message={error} onRetry={load} /></Card>
    </Page>
  );

  const list = { pending, completed, overdue, upcoming }[activeTab] || pending;
  const EMPTY = {
    pending:   { icon: CheckCircle2, title: 'All caught up',          description: 'You have no pending quizzes right now.' },
    upcoming:  { icon: CalendarClock, title: 'Nothing scheduled',     description: 'Quizzes your teacher schedules for later will show up here.' },
    completed: { icon: Layers,       title: 'Nothing completed yet',  description: 'Quizzes you finish will show up here.' },
    overdue:   { icon: CheckCircle2, title: 'Nothing overdue',        description: 'You are on top of every deadline.' },
  }[activeTab];

  return (
    <Page>
      {header}

      <div className="space-y-6 animate-fade-up">
        {/* Enrolled batches */}
        {batches.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Your batches">
            {batches.map(b => (
              <li key={b._id}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-full text-sm shadow-card">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color || 'var(--color-brand-500)' }} aria-hidden="true" />
                <span className="text-gray-800 dark:text-gray-200 font-medium">{b.name}</span>
                {b.assignmentCount !== undefined && (
                  <span className="text-gray-500 dark:text-gray-400 text-xs tabular-nums">{b.assignmentCount} quiz{b.assignmentCount !== 1 ? 'zes' : ''}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {assignments.length === 0 ? (
          <Card>
            <EmptyState
              icon={Layers}
              title="No assignments yet"
              description={batches.length > 0
                ? "Your teacher hasn't assigned any quizzes yet. Check back soon."
                : 'Ask your org admin to add you to a batch.'}
              action={<Button to="/quizzes" icon={Compass}>Browse open quizzes</Button>}
            />
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <StatCard label="Pending"   value={pending.length} />
              <StatCard label="Completed" value={completed.length} />
              <StatCard label="Overdue"   value={overdue.length} hint={overdue.length ? 'Needs attention' : undefined} />
            </div>

            <Tabs
              label="Filter assignments"
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { value: 'pending',   label: 'Pending',   count: pending.length },
                { value: 'completed', label: 'Completed', count: completed.length },
                { value: 'overdue',   label: 'Overdue',   count: overdue.length },
                { value: 'upcoming',  label: 'Upcoming',  count: upcoming.length },
              ]}
            />

            {list.length === 0 ? (
              <Card><EmptyState compact {...EMPTY} /></Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {list.map(a => <AssignmentCard key={a._id} asgn={a} />)}
              </div>
            )}
          </>
        )}
      </div>
    </Page>
  );
};

export default MyClasses;
