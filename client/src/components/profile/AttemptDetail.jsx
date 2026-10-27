import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import {
  CheckCircle2, XCircle, MinusCircle, ChevronDown, Repeat, SearchX, Lightbulb,
  ShieldCheck, ShieldAlert, ArrowLeft, ListChecks, Check, X,
} from 'lucide-react';
import { VIOLATION_LABELS } from '../../utils/useProctoring';
import { Page, PageHeader, Card, CardHeader, Badge, ProgressRing, Tabs, Button, EmptyState, ErrorState } from '../ui';
import { SkeletonBlock, Bar } from '../Skeleton';

const LETTERS = 'ABCDEFGHIJ';

const STATUS_STYLE = {
  correct:   { icon: CheckCircle2, num: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', label: 'Correct',      tone: 'green' },
  incorrect: { icon: XCircle,      num: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',                 label: 'Incorrect',    tone: 'red' },
  skipped:   { icon: MinusCircle,  num: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',               label: 'Not answered', tone: 'gray' },
};

const AttemptDetail = () => {
  const { id } = useParams();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [filter,    setFilter]    = useState('all');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get(`/attempts/${id}`)
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load attempt.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const toggle = qid => setCollapsed(p => ({ ...p, [qid]: !p[qid] }));

  const back = { to: '/my-attempts', label: 'My attempts' };

  if (loading) return (
    <Page width="lg">
      <SkeletonBlock label="Loading attempt">
        <Bar className="h-4 w-28 mb-5" />
        <Bar className="h-7 w-72 max-w-full mb-2" />
        <Bar className="h-4 w-48 mb-8 bg-gray-100 dark:bg-gray-800/60" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col items-center">
            <Bar className="h-32 w-32 rounded-full mb-5" />
            <div className="grid grid-cols-2 gap-3 w-full">
              {[0, 1, 2, 3].map(i => <Bar key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800/60" />)}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                <Bar className="h-4 w-3/4 mb-4" />
                {[0, 1, 2].map(j => <Bar key={j} className="h-10 w-full mb-2 rounded-lg bg-gray-100 dark:bg-gray-800/60" />)}
              </div>
            ))}
          </div>
        </div>
      </SkeletonBlock>
    </Page>
  );

  if (error) return (
    <Page width="md">
      <PageHeader back={back} title="Attempt review" />
      <Card>
        <ErrorState title="Couldn't load this attempt" message={error} onRetry={load} />
      </Card>
    </Page>
  );

  if (!data?.attempt) return (
    <Page width="md">
      <PageHeader back={back} title="Attempt review" />
      <Card>
        <EmptyState icon={SearchX} title="Attempt not found"
          description="It may have been removed, or the link is incorrect."
          action={<Button to="/my-attempts" variant="secondary" icon={ArrowLeft}>Back to my attempts</Button>} />
      </Card>
    </Page>
  );

  const { attempt } = data;
  // The API nests the quiz inside the attempt; older shapes returned it alongside
  const quiz    = data.quiz || attempt.quiz || {};
  const locked  = !!data.reviewLocked;
  const pct     = attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;
  const passMark = quiz.passScore || 40;
  const passed  = pct >= passMark;
  const correct = attempt.answers?.filter(a => a.isCorrect).length || 0;
  const total   = quiz.questions?.length || 0;
  const ms      = new Date(attempt.completedAt) - new Date(attempt.startedAt);
  const fmtTime = ms => isNaN(ms) || ms < 0 ? 'N/A' : `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;

  const optionText  = (qid, oid) => quiz.questions?.find(q => q._id === qid)?.options?.find(o => o._id === oid)?.text || 'N/A';
  const correctText = qid => quiz.questions?.find(q => q._id === qid)?.options?.find(o => o.isCorrect)?.text || 'N/A';

  // Attempts store the chosen option's id when present, otherwise its text (`selectedAnswer`)
  const isSelected = (ans, o) => (ans?.selectedOptionId
    ? o._id === ans.selectedOptionId
    : !!ans?.selectedAnswer && o.text === ans.selectedAnswer);
  const answerText = (q, ans) => (ans?.selectedOptionId ? optionText(q._id, ans.selectedOptionId) : ans?.selectedAnswer || 'Not answered');

  const review = (quiz.questions || []).map((q, idx) => {
    const ans = attempt.answers?.find(a => a.questionId === q._id);
    const answered = !!(ans && (ans.selectedOptionId || ans.selectedAnswer));
    const status = ans?.isCorrect ? 'correct' : answered ? 'incorrect' : 'skipped';
    return { q, idx, ans, status };
  });

  const shown = review.filter(r => filter === 'all' || (filter === 'correct' ? r.status === 'correct' : r.status !== 'correct'));
  const ringTone = !passed ? 'red' : pct >= 70 ? 'green' : 'amber';

  return (
    <Page width="lg">
      <PageHeader
        back={back}
        eyebrow={quiz.category || 'Attempt review'}
        title={quiz.title || 'Quiz'}
        description={attempt.completedAt ? `Completed ${new Date(attempt.completedAt).toLocaleString()}` : undefined}
        actions={quiz._id && <Button to={`/quiz/${quiz._id}/take`} icon={Repeat}>Retake quiz</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up">

        {/* Score summary */}
        <div className="space-y-4 lg:sticky lg:top-20 self-start">
          <Card>
            <div className="flex sm:flex-col items-center gap-5 sm:gap-4 sm:text-center">
              <ProgressRing value={pct} size={128} stroke={10} tone={ringTone} label={`Score ${pct}%, ${passed ? 'passed' : 'failed'}`}>
                <span className="text-3xl font-bold text-gray-900 dark:text-white font-display tabular-nums">{pct}%</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{attempt.score} / {attempt.maxScore} pts</span>
              </ProgressRing>
              <div className="min-w-0">
                <Badge tone={passed ? 'green' : 'red'} icon={passed ? Check : X} className="text-sm px-2.5 py-1">
                  {passed ? 'Passed' : 'Not passed'}
                </Badge>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Pass mark {passMark}%</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-2.5 mt-6">
              {[
                { label: 'Correct',   value: correct,          cls: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Incorrect', value: total - correct,  cls: 'text-red-600 dark:text-red-400' },
                { label: 'Time',      value: fmtTime(ms),      cls: 'text-gray-900 dark:text-white' },
                { label: 'Questions', value: total,            cls: 'text-gray-900 dark:text-white' },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 px-3 py-2.5">
                  <dt className="text-xs text-gray-500 dark:text-gray-400">{s.label}</dt>
                  <dd className={`text-lg font-bold tabular-nums font-display ${s.cls}`}>{s.value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {attempt.proctored && (
            <div className={`bg-white dark:bg-gray-900 border rounded-2xl shadow-card overflow-hidden ${
              attempt.violationCount > 0 ? 'border-red-200 dark:border-red-500/30' : 'border-emerald-200 dark:border-emerald-500/30'
            }`}>
              <div className="px-5 py-4 flex items-start gap-3 border-b border-gray-100 dark:border-gray-800">
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${attempt.violationCount > 0 ? 'bg-red-50 dark:bg-red-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10'}`}>
                  {attempt.violationCount > 0
                    ? <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
                    : <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />}
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Proctoring report</p>
                  <p className={`text-xs mt-0.5 ${attempt.violationCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {attempt.violationCount > 0
                      ? `${attempt.violationCount} violation${attempt.violationCount === 1 ? '' : 's'} recorded`
                      : 'No violations recorded'}
                  </p>
                </div>
              </div>

              {attempt.autoSubmitted && (
                <p className="px-5 py-2.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10">
                  Auto-submitted after reaching the violation limit.
                </p>
              )}

              {attempt.violations?.length > 0 && (
                <ol className="divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto">
                  {attempt.violations.map((v, i) => (
                    <li key={i} className="px-5 py-2.5 flex items-start justify-between gap-3">
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        <span className="text-gray-400 mr-1.5 tabular-nums">{i + 1}.</span>
                        {VIOLATION_LABELS[v.type] || v.type}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 tabular-nums">
                        {new Date(v.at).toLocaleTimeString()}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>

        {/* Question review */}
        <div className="lg:col-span-2 min-w-0">
          <Card padding={false}>
            <CardHeader icon={ListChecks} title="Question review" subtitle={`${correct} of ${total} correct`} />
            <div className="px-4 sm:px-6 pt-4">
              <Tabs label="Filter questions" value={filter} onChange={setFilter} options={[
                { value: 'all',       label: 'All',       count: total },
                { value: 'correct',   label: 'Correct',   count: correct },
                { value: 'incorrect', label: 'Incorrect', count: total - correct },
              ]} />
              {locked && (
                <p role="status" className="mt-3 text-sm rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-900 dark:text-brand-200 px-3.5 py-2.5">
                  You still have attempts left on this assignment, so correct answers are hidden until your final attempt or until it closes.
                </p>
              )}
            </div>

            {total === 0 ? (
              <EmptyState compact icon={SearchX} title="Question details unavailable"
                description="The questions for this quiz could not be loaded." />
            ) : shown.length === 0 ? (
              <EmptyState compact icon={filter === 'incorrect' ? CheckCircle2 : XCircle}
                title={filter === 'incorrect' ? 'No incorrect answers' : 'No correct answers'}
                description={filter === 'incorrect' ? 'You answered every question correctly.' : 'Review the explanations to see where things went wrong.'}
                action={<Button variant="secondary" size="sm" onClick={() => setFilter('all')}>Show all questions</Button>} />
            ) : (
              <ol className="p-4 sm:p-6 space-y-3">
                {shown.map(({ q, idx, ans, status }) => {
                  const st   = STATUS_STYLE[status];
                  const open = !collapsed[q._id];
                  const panelId = `q-${q._id}`;
                  const hasOptions = q.options?.length > 0;
                  return (
                    <li key={q._id}
                      className={`rounded-xl border ${status === 'correct'
                        ? 'border-emerald-200/80 dark:border-emerald-500/20'
                        : status === 'incorrect' ? 'border-red-200/80 dark:border-red-500/20'
                        : 'border-gray-200 dark:border-gray-800'}`}>
                      <button type="button" onClick={() => toggle(q._id)} aria-expanded={open} aria-controls={panelId}
                        className="w-full flex items-start gap-3 px-4 py-3.5 text-left rounded-xl hover:bg-gray-50/80 dark:hover:bg-gray-800/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold tabular-nums shrink-0 ${st.num}`}>
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">{q.text}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <Badge tone={st.tone} icon={st.icon}>{st.label}</Badge>
                            {q.points != null && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                                {ans?.pointsEarned ?? 0} / {q.points} pt{q.points === 1 ? '' : 's'}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 mt-1.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                      </button>

                      {open && (
                        <div id={panelId} className="px-4 pb-4 sm:pl-14 space-y-2">
                          {hasOptions ? (
                            <ul className="space-y-2" aria-label="Answer options">
                              {q.options.map((o, oi) => {
                                const picked = isSelected(ans, o);
                                // Locked assignment reviews omit isCorrect; colour only the student's own pick then
                                const right  = locked ? picked && !!ans?.isCorrect : !!o.isCorrect;
                                const cls = right
                                  ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10'
                                  : picked
                                    ? 'border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10'
                                    : 'border-gray-200 dark:border-gray-800';
                                const letterCls = right
                                  ? 'bg-emerald-600 text-white'
                                  : picked ? 'bg-red-600 text-white'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
                                return (
                                  <li key={o._id || oi} className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${cls}`}>
                                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 ${letterCls}`} aria-hidden="true">
                                      {right ? <Check className="h-3.5 w-3.5" /> : picked ? <X className="h-3.5 w-3.5" /> : LETTERS[oi] || oi + 1}
                                    </span>
                                    <span className={`flex-1 min-w-0 text-sm pt-0.5 ${right || picked ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                      {o.text}
                                    </span>
                                    {(picked || right) && (
                                      <span className="flex flex-wrap justify-end gap-1 shrink-0 pt-0.5">
                                        {picked && <Badge tone={right ? 'green' : 'red'}>Your answer</Badge>}
                                        {right && !picked && <Badge tone="green">Correct answer</Badge>}
                                      </span>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <>
                              <div className={`p-3 rounded-lg border ${status === 'correct' ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10' : 'border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10'}`}>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Your answer</p>
                                <p className="text-sm text-gray-900 dark:text-white">{ans ? answerText(q, ans) : 'Not answered'}</p>
                              </div>
                              {status !== 'correct' && (
                                <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Correct answer</p>
                                  <p className="text-sm text-gray-900 dark:text-white">{correctText(q._id)}</p>
                                </div>
                              )}
                            </>
                          )}

                          {status === 'skipped' && hasOptions && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">You did not answer this question.</p>
                          )}

                          {q.explanation && (
                            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/20 flex items-start gap-3">
                              <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                              <div>
                                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-0.5">Explanation</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{q.explanation}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
};

export default AttemptDetail;
