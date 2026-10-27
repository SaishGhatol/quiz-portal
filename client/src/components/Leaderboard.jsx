import React, { useState, useEffect, useContext } from 'react';
import { Trophy, Clock, Crown, UserPlus, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import AuthContext from '../contexts/AuthContext';
import { Page, PageHeader, Card, Avatar, Badge, Button, EmptyState, ErrorState } from './ui';
import { SkeletonBlock, Bar } from './Skeleton';
import { formatDuration } from '../utils/quiz';

// Medal tones for the podium: gold, silver, bronze — kept muted
const MEDAL = [
  'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30',
  'bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700',
  'bg-orange-100 text-orange-800 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/30',
];

// On sm+ the podium reads 2 · 1 · 3; on mobile it simply stacks 1, 2, 3
const PODIUM_ORDER = ['sm:order-2', 'sm:order-1', 'sm:order-3'];

const scoreText = s => (s == null ? '—' : `${s}%`);

const RankChip = ({ rank, className = '' }) => (
  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold tabular-nums ring-1 shrink-0 ${MEDAL[rank - 1]} ${className}`}>
    <span className="sr-only">Rank </span>{rank}
  </span>
);

const PodiumCard = ({ entry, rank, isMe }) => {
  const first = rank === 1;
  const name = entry?.user?.name || 'Anonymous';
  return (
    <li className={`${PODIUM_ORDER[rank - 1]} ${first ? 'sm:-mt-4' : 'sm:mt-4'}`}>
      <div className={[
        'relative h-full bg-white dark:bg-gray-900 border rounded-2xl shadow-card',
        'flex sm:flex-col items-center gap-3 sm:gap-0 p-4 sm:px-4 sm:pt-6 sm:pb-5 sm:text-center',
        first ? 'border-amber-200 dark:border-amber-500/30 sm:shadow-raised' : 'border-gray-200/80 dark:border-gray-800',
        isMe ? 'ring-2 ring-brand-500/40' : '',
      ].join(' ')}>
        {first && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-amber-400/80" />}

        <RankChip rank={rank} className="sm:absolute sm:top-3 sm:left-3" />

        <div className="relative shrink-0 sm:mb-3">
          <Avatar name={name} size={first ? 'lg' : 'md'} />
          {first && (
            <span className="hidden sm:flex absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 text-white items-center justify-center ring-2 ring-white dark:ring-gray-900" aria-hidden="true">
              <Crown className="h-3.5 w-3.5" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 sm:flex-none sm:w-full">
          <p className="flex items-center sm:justify-center gap-1.5 min-w-0">
            <span className={`text-sm font-semibold truncate ${isMe ? 'text-brand-700 dark:text-brand-300' : 'text-gray-900 dark:text-white'}`}>{name}</span>
            {isMe && <Badge tone="brand" className="shrink-0">You</Badge>}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5" title={entry?.quiz?.title}>{entry?.quiz?.title || quizzesLabel(entry)}</p>
        </div>

        <div className="text-right sm:text-center shrink-0 sm:mt-4">
          <p className={`font-display font-bold tabular-nums text-gray-900 dark:text-white ${first ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}>
            {scoreText(entry?.score)}
          </p>
          <p className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 tabular-nums mt-0.5">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">Time taken</span>{formatDuration(entry?.timeTaken)}
          </p>
        </div>
      </div>
    </li>
  );
};

const LeaderboardSkeleton = () => (
  <SkeletonBlock label="Loading leaderboard">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
      {[0, 1, 2].map(i => (
        <div key={i} className={`bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-4 sm:p-6 flex sm:flex-col items-center gap-3 ${PODIUM_ORDER[i]} ${i === 0 ? 'sm:-mt-4' : 'sm:mt-4'}`}>
          <Bar className="h-10 w-10 sm:h-14 sm:w-14 rounded-full shrink-0" />
          <div className="flex-1 sm:flex-none w-full space-y-2 sm:flex sm:flex-col sm:items-center">
            <Bar className="h-3.5 w-28" />
            <Bar className="h-3 w-20 bg-gray-100 dark:bg-gray-800/60" />
          </div>
          <Bar className="h-6 w-14 shrink-0" />
        </div>
      ))}
    </div>
    <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl divide-y divide-gray-100 dark:divide-gray-800">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Bar className="h-3.5 w-6 shrink-0" />
          <Bar className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Bar className="h-3.5" style={{ width: `${55 - i * 5}%` }} />
            <Bar className="h-3 w-24 bg-gray-100 dark:bg-gray-800/60" />
          </div>
          <Bar className="h-4 w-12 shrink-0" />
        </div>
      ))}
    </div>
  </SkeletonBlock>
);

// Overall ranking spans several quizzes, so rows show how many instead of a title
const quizzesLabel = e => (e?.quizzesTaken ? `${e.quizzesTaken} quiz${e.quizzesTaken === 1 ? '' : 'zes'}` : '—');

const Leaderboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [attempt, setAttempt] = useState(0); // bump to refetch

  useEffect(() => {
    let active = true;
    api.get('/quizzes/leaderboard?limit=50')
      .then(r => { if (active) setEntries(r.data.leaderboard || []); })
      .catch(() => { if (active) setError('Failed to load leaderboard.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  const retry = () => { setError(null); setLoading(true); setAttempt(a => a + 1); };

  // The auth payload exposes `id`; older code paths used `_id`
  const myId = currentUser?.id || currentUser?._id;
  const isMe = e => !!myId && String(e?.user?._id) === String(myId);
  const myRank = entries.findIndex(isMe) + 1;

  const podium = entries.slice(0, 3);
  const rest   = entries.slice(3);

  let body;
  if (loading) body = <LeaderboardSkeleton />;
  else if (error) body = <Card><ErrorState title="Couldn't load the leaderboard" message={error} onRetry={retry} /></Card>;
  else if (entries.length === 0) body = (
    <Card>
      <EmptyState icon={Trophy} title="No rankings yet"
        description="Once learners complete quizzes, the best scores show up here."
        action={<Button to="/quizzes" iconRight={ArrowRight}>Take a quiz</Button>} />
    </Card>
  );
  else body = (
    <>
      {myRank > 0 && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 text-sm text-brand-800 dark:text-brand-200">
          <Trophy className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true" />
          <span>You're ranked <strong className="font-semibold tabular-nums">#{myRank}</strong> of {entries.length} on this board.</span>
        </div>
      )}

      {/* Top three */}
      <h2 className="sr-only">Top three</h2>
      <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 sm:items-stretch mb-8 sm:pt-4">
        {podium.map((e, i) => <PodiumCard key={e?.attemptId || i} entry={e} rank={i + 1} isMe={isMe(e)} />)}
      </ol>

      {rest.length > 0 && (
        <Card padding={false}>
          <h2 className="sr-only">Other rankings</h2>
          <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider" aria-hidden="true">
            <span className="col-span-1">Rank</span>
            <span className="col-span-5">Learner</span>
            <span className="col-span-3">Quizzes</span>
            <span className="col-span-2 text-right">Avg best</span>
            <span className="col-span-1 text-right">Total time</span>
          </div>

          <ol className="divide-y divide-gray-100 dark:divide-gray-800" start={4}>
            {rest.map((e, idx) => {
              const rank = idx + 4;
              const me = isMe(e);
              const name = e?.user?.name || 'Anonymous';
              return (
                <li key={e?.attemptId || rank} aria-current={me ? 'true' : undefined}
                  className={`relative flex items-center gap-3 sm:grid sm:grid-cols-12 px-4 sm:px-5 py-3.5 ${me ? 'bg-brand-50/70 dark:bg-brand-500/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}>
                  {me && <span aria-hidden="true" className="absolute left-0 inset-y-0 w-0.5 bg-brand-500" />}
                  <span className="sm:col-span-1 w-7 sm:w-auto shrink-0 text-sm font-semibold tabular-nums text-gray-500 dark:text-gray-400">
                    <span className="sr-only">Rank </span>{rank}
                  </span>
                  <div className="sm:col-span-5 flex items-center gap-3 min-w-0 flex-1">
                    <Avatar name={name} size="sm" />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-sm font-medium truncate ${me ? 'text-brand-700 dark:text-brand-300' : 'text-gray-900 dark:text-white'}`}>{name}</span>
                        {me && <Badge tone="brand" className="shrink-0">You</Badge>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate sm:hidden">{e?.quiz?.title || quizzesLabel(e)}</p>
                    </div>
                  </div>
                  <span className="hidden sm:block sm:col-span-3 text-sm text-gray-500 dark:text-gray-400 truncate" title={e?.quiz?.title}>{e?.quiz?.title || quizzesLabel(e)}</span>
                  <div className="shrink-0 sm:col-span-2 text-right">
                    <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">{scoreText(e?.score)}</p>
                    <p className="sm:hidden text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">{formatDuration(e?.timeTaken)}</p>
                  </div>
                  <span className="hidden sm:block sm:col-span-1 text-right text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                    <span className="sr-only">Time taken </span>{formatDuration(e?.timeTaken)}
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>
      )}
    </>
  );

  return (
    <Page width="md">
      <PageHeader
        eyebrow="Rankings"
        title="Leaderboard"
        description="Each learner's best score on every public quiz, averaged. Ties go to whoever has taken more quizzes, then to the faster total time."
        actions={<Button to="/quizzes" variant="secondary" iconRight={ArrowRight}>Explore quizzes</Button>}
      />

      {body}

      {!currentUser && !loading && !error && (
        <Card className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Want to see your name here?</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Create a free account and your best scores are ranked automatically.</p>
          </div>
          <Button to="/register" icon={UserPlus} className="shrink-0">Create an account</Button>
        </Card>
      )}
    </Page>
  );
};

export default Leaderboard;
