import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import AuthContext from '../../contexts/AuthContext';
import SkeletonBlock, { Bar } from '../Skeleton';
import {
  ArrowLeft, Play, Clock, HelpCircle, Target, Users, ShieldCheck, CheckCircle2, History, ArrowRight, RotateCcw, Info,
  Bookmark, BookmarkCheck, Dumbbell,
} from 'lucide-react';
import { Button, Card, CardHeader, DifficultyBadge, ErrorState, Badge } from '../ui';
import { categoryMeta, percent, scoreTone, TONE_TEXT, formatRelative } from '../../utils/quiz';

const QuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [quiz,          setQuiz]          = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [history,       setHistory]       = useState([]);
  const [eligibility,   setEligibility]   = useState(null);
  const [saved,         setSaved]         = useState(false);
  const [savingToggle,  setSavingToggle]  = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [qRes, qqRes] = await Promise.all([
        api.get(`/quizzes/${id}`),
        api.get(`/quizzes/${id}/questions`),
      ]);
      setQuiz(qRes.data.quiz);
      setQuestionCount(qqRes.data.questions?.length || 0);
      // Assignment windows and attempt limits decide whether Start is offered
      api.get(`/quizzes/${id}/eligibility`).then(r => setEligibility(r.data)).catch(() => setEligibility(null));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quiz.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!currentUser) return;
    api.get('/users/me/saved')
      .then(r => setSaved((r.data.ids || []).some(x => String(x) === String(id))))
      .catch(() => {});
  }, [currentUser, id]);

  const toggleSaved = async () => {
    setSavingToggle(true);
    try {
      if (saved) await api.delete(`/users/me/saved/${id}`); else await api.put(`/users/me/saved/${id}`);
      setSaved(s => !s);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update your saved quizzes');
    } finally {
      setSavingToggle(false);
    }
  };

  // The user's own previous attempts at this quiz — nice to have, so failures are ignored
  useEffect(() => {
    if (!currentUser) return;
    api.get('/quizzes/my-attempts')
      .then(r => setHistory((r.data.attempts || [])
        .filter(a => a.completedAt && (a.quiz?._id || a.quiz) === id)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))))
      .catch(() => {});
  }, [currentUser, id]);

  if (loading) return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <SkeletonBlock label="Loading quiz">
          <Bar className="h-4 w-32 mb-6" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-7 space-y-3">
                <Bar className="h-5 w-24" /><Bar className="h-8 w-3/4" /><Bar className="h-4 w-full" /><Bar className="h-4 w-2/3" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map(i => <Bar key={i} className="h-20 rounded-2xl" />)}
              </div>
            </div>
            <Bar className="h-56 rounded-2xl" />
          </div>
        </SkeletonBlock>
      </div>
    </div>
  );

  if (error || !quiz) return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 px-4 py-10">
      <Card className="max-w-lg mx-auto">
        <ErrorState title={error ? 'Could not load quiz' : 'Quiz not found'} message={error} onRetry={error ? load : undefined}
          action={<Button to="/quizzes" variant={error ? 'ghost' : 'primary'} icon={ArrowLeft}>Back to quizzes</Button>} />
      </Card>
    </div>
  );

  const { icon: CatIcon, cls: catCls } = categoryMeta(quiz.category);
  const bestScore = history.length ? Math.max(...history.map(percent)) : null;
  const passScore = quiz.passScore || null;
  const proctored = !!quiz.proctoring?.enabled;

  const facts = [
    { icon: HelpCircle, label: 'Questions',  value: questionCount },
    { icon: Clock,      label: 'Time limit', value: quiz.timeLimit ? `${quiz.timeLimit} min` : 'None' },
    { icon: Target,     label: 'Pass mark',  value: passScore ? `${passScore}%` : '—' },
    { icon: Users,      label: 'Attempts',   value: (quiz.totalAttempts || 0).toLocaleString() },
  ];

  const tips = [
    'Read each question carefully before answering.',
    'Jump between questions freely and flag ones to revisit.',
    quiz.timeLimit ? `You have ${quiz.timeLimit} minutes — the quiz auto-submits when time is up.` : 'There is no time limit — take your time.',
    'You\'ll see your score and a full answer review right after submitting.',
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <Link to="/quizzes" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All quizzes
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── Main ── */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="sm:p-8">
              <div className="flex items-center gap-2.5 flex-wrap mb-5">
                <span className={`inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-lg text-xs font-semibold ${catCls}`}>
                  <span className="w-6 h-6 rounded-md flex items-center justify-center"><CatIcon className="h-3.5 w-3.5" aria-hidden="true" /></span>
                  {quiz.category}
                </span>
                <DifficultyBadge difficulty={quiz.difficulty} />
                {proctored && <Badge tone="amber" icon={ShieldCheck}>Proctored</Badge>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">{quiz.title}</h1>
              {quiz.description && <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">{quiz.description}</p>}
              {quiz.createdBy?.name && <p className="mt-5 text-xs text-gray-400">Created by {quiz.createdBy.name}</p>}
            </Card>

            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {facts.map(f => (
                <div key={f.label} className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card p-4">
                  <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    <f.icon className="h-3.5 w-3.5" aria-hidden="true" />{f.label}
                  </dt>
                  <dd className="mt-1.5 text-lg font-bold font-display text-gray-900 dark:text-white tabular-nums">{f.value}</dd>
                </div>
              ))}
            </dl>

            <Card>
              <h2 className="text-[15px] font-bold text-gray-900 dark:text-white mb-4">Before you start</h2>
              <ul className="space-y-3">
                {tips.map(t => (
                  <li key={t} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />{t}
                  </li>
                ))}
              </ul>
              {proctored && (
                <div className="mt-5 flex gap-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4">
                  <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
                  <p className="text-sm text-amber-900 dark:text-amber-200">
                    This quiz is proctored. Tab switches, leaving fullscreen and copy/paste may be recorded — you'll see the exact rules before starting.
                  </p>
                </div>
              )}
            </Card>

            {currentUser && (
              <Card padding={false}>
                <CardHeader title="Your attempts" icon={History}
                  subtitle={history.length ? `${history.length} attempt${history.length > 1 ? 's' : ''} so far` : undefined} />
                {history.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-gray-500 dark:text-gray-400 text-center">You haven't taken this quiz yet. Your results will appear here.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {history.slice(0, 5).map(a => {
                      const p = percent(a);
                      return (
                        <li key={a._id}>
                          <Link to={`/attempts/${a._id}`} className="group flex items-center gap-4 px-5 sm:px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                            <span className="text-sm text-gray-600 dark:text-gray-300 flex-1">{formatRelative(a.completedAt)}</span>
                            <span className="text-xs text-gray-400 tabular-nums">{a.score}/{a.maxScore} pts</span>
                            <span className={`text-sm font-bold tabular-nums w-12 text-right ${TONE_TEXT[scoreTone(p)]}`}>{p}%</span>
                            <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-brand-500" aria-hidden="true" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:sticky lg:top-24">
            <Card>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{bestScore === null ? 'Ready when you are' : 'Beat your best'}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {questionCount} question{questionCount !== 1 ? 's' : ''} · {quiz.timeLimit ? `${quiz.timeLimit} min` : 'No time limit'}
              </p>

              {bestScore !== null && (
                <div className="mt-5 flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800/60 px-4 py-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Your best score</span>
                  <span className={`text-lg font-bold font-display tabular-nums ${TONE_TEXT[scoreTone(bestScore)]}`}>{bestScore}%</span>
                </div>
              )}

              {currentUser ? (
                <>
                  <Button size="lg" fullWidth className="mt-5" icon={bestScore === null ? Play : RotateCcw}
                    onClick={() => navigate(`/quiz/${id}/take`)} disabled={questionCount === 0 || eligibility?.canTake === false}>
                    {bestScore === null ? 'Start quiz' : 'Retake quiz'}
                  </Button>
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
                    {questionCount === 0 ? 'This quiz has no questions yet.'
                      : eligibility?.canTake === false ? eligibility.reason
                      : typeof eligibility?.attemptsLeft === 'number' ? `${eligibility.attemptsLeft} attempt${eligibility.attemptsLeft === 1 ? '' : 's'} left for this assignment.`
                      : 'Your result is saved automatically.'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    {/* Practice reveals answers, so it's off for proctored quizzes and open assignments */}
                    {questionCount > 0 && !proctored && typeof eligibility?.attemptsLeft !== 'number' && eligibility?.canTake !== false ? (
                      <Button variant="secondary" icon={Dumbbell} to={`/practice/${id}`}>Practice</Button>
                    ) : <span />}
                    <Button variant={saved ? 'soft' : 'secondary'} icon={saved ? BookmarkCheck : Bookmark}
                      onClick={toggleSaved} loading={savingToggle} aria-pressed={saved}>
                      {saved ? 'Saved' : 'Save'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="mt-5 flex gap-3 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 p-4">
                  <Info className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">Sign in</Link>{' '}or{' '}
                    <Link to="/register" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">create a free account</Link>{' '}
                    to take this quiz and track your progress.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizDetail;
