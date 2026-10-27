import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import SkeletonBlock, { ListSkeleton } from '../Skeleton';
import { Page, PageHeader, Card, Button, Badge, EmptyState, ErrorState } from '../ui';
import { Dumbbell, Check, X, Lightbulb, Repeat, PartyPopper, Compass } from 'lucide-react';
import { categoryMeta, formatRelative } from '../../utils/quiz';

/**
 * Mistake notebook: every question whose latest answer was wrong, with the right
 * answer and explanation. Answering one correctly in practice clears it.
 */
const Mistakes = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizFilter, setQuizFilter] = useState('all');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/practice/mistakes')
      .then(r => setItems(r.data.mistakes || []))
      .catch(err => setError(err.response?.data?.message || 'Could not load your mistakes.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // One filter chip per quiz, most mistakes first
  const quizzes = useMemo(() => {
    const map = new Map();
    items.forEach(m => {
      const q = map.get(m.quiz._id) || { ...m.quiz, count: 0 };
      q.count++;
      map.set(m.quiz._id, q);
    });
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [items]);

  const shown = quizFilter === 'all' ? items : items.filter(m => m.quiz._id === quizFilter);

  return (
    <Page width="md">
      <PageHeader
        eyebrow="Practice"
        title="Mistake notebook"
        description="Questions you got wrong, with the right answer. Get one right in practice and it leaves the notebook."
        actions={items.length > 0 && <Button icon={Dumbbell} to="/practice/mistakes">Drill all {items.length}</Button>}
      />

      {loading ? (
        <SkeletonBlock label="Loading your mistakes"><ListSkeleton rows={4} /></SkeletonBlock>
      ) : error ? (
        <Card><ErrorState title="Couldn't load your notebook" message={error} onRetry={load} /></Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState icon={PartyPopper} title="Nothing to fix right now"
            description="When you miss a question in a quiz, it lands here with the correct answer so you can learn it."
            action={<Button to="/quizzes" icon={Compass}>Explore quizzes</Button>} />
        </Card>
      ) : (
        <>
          {quizzes.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap mb-5" role="group" aria-label="Filter by quiz">
              {[{ _id: 'all', title: 'All quizzes', count: items.length }, ...quizzes].map(q => {
                const active = quizFilter === q._id;
                return (
                  <button key={q._id} type="button" aria-pressed={active} onClick={() => setQuizFilter(q._id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-medium whitespace-nowrap ${
                      active
                        ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                    }`}>
                    {q.title}
                    <span className={`text-[11px] tabular-nums px-1.5 rounded-full ${active ? 'bg-white/20 dark:bg-gray-900/10' : 'bg-gray-100 dark:bg-gray-800'}`}>{q.count}</span>
                  </button>
                );
              })}
            </div>
          )}

          <ol className="space-y-4">
            {shown.map(m => {
              const { icon: Icon, cls } = categoryMeta(m.quiz.category);
              const correct = m.question.options.find(o => String(o._id) === String(m.correctOptionId));
              return (
                <li key={m.question._id}>
                  <Card>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <Link to={`/quiz/${m.quiz._id}`} className="flex items-center gap-2 min-w-0 group">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cls}`}><Icon className="h-3.5 w-3.5" aria-hidden="true" /></span>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate group-hover:text-brand-600 dark:group-hover:text-brand-300">{m.quiz.title}</span>
                      </Link>
                      <div className="flex items-center gap-2 shrink-0">
                        {m.timesMissed > 1 && <Badge tone="red" icon={Repeat}>Missed {m.timesMissed}×</Badge>}
                        <span className="text-xs text-gray-400">{formatRelative(m.lastMissedAt)}</span>
                      </div>
                    </div>

                    <p className="font-semibold text-gray-900 dark:text-white leading-relaxed whitespace-pre-line">{m.question.text}</p>

                    <dl className="mt-4 grid sm:grid-cols-2 gap-2.5">
                      <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3.5 py-2.5">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 flex items-center gap-1"><X className="h-3 w-3" aria-hidden="true" />Your answer</dt>
                        <dd className="text-sm text-gray-900 dark:text-white mt-0.5">{m.yourAnswer || 'Not answered'}</dd>
                      </div>
                      <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-2.5">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 flex items-center gap-1"><Check className="h-3 w-3" aria-hidden="true" />Correct answer</dt>
                        <dd className="text-sm text-gray-900 dark:text-white mt-0.5">{correct?.text || '—'}</dd>
                      </div>
                    </dl>

                    {m.explanation && (
                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 flex gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />{m.explanation}
                      </p>
                    )}
                  </Card>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </Page>
  );
};

export default Mistakes;
