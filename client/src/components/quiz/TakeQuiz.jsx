import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import ConfirmDialog from '../ConfirmDialog';
import useProctoring, { VIOLATION_LABELS } from '../../utils/useProctoring';
import { Button, Card, DifficultyBadge, ProgressBar, ErrorState, EmptyState, Spinner } from '../ui';
import {
  ArrowLeft, ArrowRight, Clock, Check, Flag, HelpCircle, ShieldCheck, ShieldAlert, Maximize, Send, Keyboard, SearchX, Play, Lock,
} from 'lucide-react';

const LETTERS = 'ABCDEFGHIJ';

const TakeQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  // Server's verdict on whether this user may take the quiz now (assignment windows, attempt limits)
  const [eligibility, setEligibility] = useState(null);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Guards a second submit from the timer, the violation limit or a double click
  const submittingRef = useRef(false);
  // Lets submitQuiz reach the proctor without closing over stale state
  const proctorRef = useRef(null);

  const fetchQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/quizzes/${id}/questions`);
      setQuiz(response.data.quiz);
      setQuestions(response.data.questions);
      const elig = await api.get(`/quizzes/${id}/eligibility`).catch(() => null);
      setEligibility(elig?.data || null);
      const initialAnswers = {};
      response.data.questions.forEach(q => { initialAnswers[q._id] = null; });
      setAnswers(initialAnswers);
      if (response.data.quiz.timeLimit) {
        setTimeLeft(response.data.quiz.timeLimit * 60);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching quiz:', err);
      setError(err.response?.data?.message || 'Failed to load the quiz. It might not exist or there was a server issue.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchQuiz(); }, [fetchQuiz]);

  const submitQuiz = useCallback(async ({ auto = false, violations = null } = {}) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    const formattedAnswers = Object.entries(answers)
      .filter(entry => entry[1] !== null)
      .map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId }));

    // Timing is measured on the server from POST /start, so only the answers are sent
    const payload = { answers: formattedAnswers };

    if (quiz?.proctoring?.enabled) {
      payload.violations = violations ?? proctorRef.current?.violations ?? [];
      payload.autoSubmitted = auto;
    }

    try {
      await proctorRef.current?.releaseFullscreen();
      const response = await api.post(`/quizzes/${id}/submit`, payload);
      toast.success(auto ? 'Time\'s up — your quiz was submitted.' : 'Quiz submitted!');
      navigate(`/quiz/results/${response.data.attemptId}`);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      const errorMessage = err.response?.data?.message || 'Failed to submit quiz.';
      toast.error(errorMessage);
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [answers, quiz, id, navigate]);

  const handleViolationLimit = useCallback(violations => {
    toast.error('Violation limit reached — your quiz is being submitted.');
    submitQuiz({ auto: true, violations });
  }, [submitQuiz]);

  const proctor = useProctoring({
    config: quiz?.proctoring,
    active: quizStarted && !submitting,
    onLimitReached: handleViolationLimit
  });
  proctorRef.current = proctor;

  const proctoringOn = !!quiz?.proctoring?.enabled;

  useEffect(() => {
    if (quizStarted && timeLeft !== null) {
      const timer = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timer);
            submitQuiz({ auto: true });
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quizStarted, timeLeft, submitQuiz]);

  // Warn before an accidental refresh/close wipes an in-progress attempt
  useEffect(() => {
    if (!quizStarted || submitting) return;
    const handler = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [quizStarted, submitting]);

  const startQuiz = async () => {
    setStarting(true);
    try {
      const { data } = await api.post(`/quizzes/${id}/start`);
      if (data.timeLimit) {
        // Resuming after a refresh keeps the original deadline
        const elapsed = Math.floor((new Date(data.serverNow) - new Date(data.startedAt)) / 1000);
        setTimeLeft(Math.max(1, data.timeLimit * 60 - elapsed));
      }
      if (proctoringOn) {
        await proctor.requestFullscreen();
      }
      setQuizStarted(true);
    } catch (err) {
      const reason = err.response?.data?.message || 'Could not start the quiz. Please try again.';
      toast.error(reason);
      if (err.response?.status === 403) setEligibility({ canTake: false, reason });
    } finally {
      setStarting(false);
    }
  };

  const handleAnswerSelect = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const toggleFlag = questionId => {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId); else next.add(questionId);
      return next;
    });
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const countAnsweredQuestions = () => Object.values(answers).filter(a => a !== null).length;
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const needsFullscreen = proctoringOn && proctor.settings.requireFullscreen && !proctor.isFullscreen && !submitting;
  const overlayOpen = needsFullscreen || !!proctor.lastViolation || showSubmitConfirm;

  // Keyboard: A–D / 1–9 pick an option, ←/→ move, F flags the question
  useEffect(() => {
    if (!quizStarted || submitting || overlayOpen) return;
    const onKey = e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      const q = questions[currentQuestionIndex];
      if (!q) return;
      const key = e.key.toUpperCase();
      let idx = -1;
      if (/^[1-9]$/.test(key)) idx = Number(key) - 1;
      else if (key.length === 1 && LETTERS.includes(key) && key !== 'F') idx = LETTERS.indexOf(key);
      if (idx >= 0 && idx < q.options.length) {
        e.preventDefault();
        setAnswers(prev => ({ ...prev, [q._id]: q.options[idx]._id }));
      } else if (e.key === 'ArrowRight') {
        setCurrentQuestionIndex(i => Math.min(i + 1, questions.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentQuestionIndex(i => Math.max(i - 1, 0));
      } else if (key === 'F') {
        toggleFlag(q._id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [quizStarted, submitting, overlayOpen, questions, currentQuestionIndex]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Spinner label="Preparing your quiz" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <ErrorState title="Couldn't load this quiz" message={error} onRetry={fetchQuiz}
            action={<Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/quizzes')}>Back to quizzes</Button>} />
        </Card>
      </div>
    );
  }

  if (!quiz || !questions.length) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <EmptyState icon={SearchX} title="Quiz not available" description="This quiz could not be found or contains no questions yet."
            action={<Button onClick={() => navigate('/quizzes')}>Back to quizzes</Button>} />
        </Card>
      </div>
    );
  }

  // Pre-start rules, built from whatever the admin switched on
  const proctoringRules = () => {
    const s = proctor.settings;
    const rules = [];
    if (s.requireFullscreen) rules.push('The quiz runs in fullscreen — leaving it is recorded.');
    if (s.blockTabSwitch)    rules.push('Switching tabs or windows is recorded.');
    if (s.blockCopyPaste)    rules.push('Copy, cut and paste are disabled.');
    if (s.blockContextMenu)  rules.push('The right-click menu is disabled.');
    rules.push(s.maxViolations > 0
      ? `After ${s.maxViolations} violation${s.maxViolations === 1 ? '' : 's'} your quiz is submitted automatically.`
      : 'Every violation is recorded and shown to your instructor.');
    return rules;
  };

  if (!quizStarted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-10">
        <div className="max-w-4xl w-full bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl shadow-raised grid md:grid-cols-[1.3fr_1fr] overflow-hidden animate-fade-up">
          <div className="p-7 sm:p-10">
            <div className="flex items-center gap-2 mb-4">
              <DifficultyBadge difficulty={quiz.difficulty} />
              {quiz.category && <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{quiz.category}</span>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">{quiz.title}</h1>
            {quiz.description && <p className="text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">{quiz.description}</p>}

            <dl className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 px-4 py-3">
                <dt className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />Questions</dt>
                <dd className="text-lg font-bold font-display text-gray-900 dark:text-white mt-0.5">{questions.length}</dd>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 px-4 py-3">
                <dt className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden="true" />Time limit</dt>
                <dd className="text-lg font-bold font-display text-gray-900 dark:text-white mt-0.5">{quiz.timeLimit > 0 ? `${quiz.timeLimit} min` : 'None'}</dd>
              </div>
            </dl>

            {proctoringOn && (
              <div className="mt-6 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert size={16} className="text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-200">This quiz is proctored</p>
                </div>
                <ul className="text-xs text-amber-900/90 dark:text-amber-200/80 space-y-1.5">
                  {proctoringRules().map((rule, i) => (
                    <li key={i} className="flex items-start gap-2"><span aria-hidden="true">•</span>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-950/40 p-7 sm:p-10 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">How it works</h2>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
                {[
                  'Answer in any order — jump around with the question palette.',
                  'Flag questions you want to come back to.',
                  quiz.timeLimit > 0 ? 'The quiz submits itself when the timer hits zero.' : 'Submit whenever you\'re ready.',
                  'You\'ll get your score and a full review instantly.',
                ].map(t => (
                  <li key={t} className="flex items-start gap-2.5"><Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />{t}</li>
                ))}
              </ul>
              <p className="hidden md:flex items-center gap-2 mt-6 text-xs text-gray-500 dark:text-gray-400">
                <Keyboard className="h-4 w-4" aria-hidden="true" />
                Shortcuts: <kbd className="kbd">A–D</kbd> answer · <kbd className="kbd">←</kbd><kbd className="kbd">→</kbd> move · <kbd className="kbd">F</kbd> flag
              </p>
            </div>
            {eligibility && !eligibility.canTake ? (
              <div className="mt-8 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4" role="status">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <Lock className="h-4 w-4" aria-hidden="true" /> You can't take this quiz right now
                </p>
                <p className="text-sm text-amber-800/90 dark:text-amber-300/80 mt-1">{eligibility.reason}</p>
                <Button variant="secondary" fullWidth className="mt-4" onClick={() => navigate('/my-assignments')}>View my assignments</Button>
              </div>
            ) : (
              <>
                <Button size="lg" fullWidth className="mt-8" icon={Play} onClick={startQuiz} loading={starting}>
                  {proctoringOn ? 'Agree & start quiz' : 'Start quiz'}
                </Button>
                {typeof eligibility?.attemptsLeft === 'number' && (
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                    {eligibility.attemptsLeft} attempt{eligibility.attemptsLeft === 1 ? '' : 's'} left for this assignment
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = countAnsweredQuestions();
  const isLast = currentQuestionIndex === questions.length - 1;
  const isFlagged = flagged.has(currentQuestion._id);
  const timeTone = timeLeft === null ? null : timeLeft < 60 ? 'red' : timeLeft < 300 ? 'amber' : 'gray';
  const flaggedOpen = questions.filter(q => flagged.has(q._id)).length;

  const timerPill = timeLeft !== null && (
    <div role="timer" aria-live={timeLeft < 60 ? 'assertive' : 'off'} aria-label={`Time left ${formatTime(timeLeft)}`}
      className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-bold tabular-nums ${
        timeTone === 'red'   ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 animate-pulse' :
        timeTone === 'amber' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400' :
                               'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
      }`}>
      <Clock className="h-4 w-4" aria-hidden="true" />{formatTime(timeLeft)}
    </div>
  );

  return (
    <div className={`min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 ${proctoringOn && proctor.settings.blockCopyPaste ? 'select-none' : ''}`}>

      {/* Hides the questions until the candidate is back in fullscreen */}
      {needsFullscreen && (
        <div className="fixed inset-0 z-[60] bg-gray-950/90 backdrop-blur-sm flex items-center justify-center px-4">
          <Card className="max-w-md w-full text-center shadow-pop">
            <Maximize className="h-10 w-10 text-amber-500 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Fullscreen required</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This quiz must stay in fullscreen. Your questions are hidden until you return. The timer keeps running.
            </p>
            <Button fullWidth onClick={() => proctor.requestFullscreen()}>Return to fullscreen</Button>
          </Card>
        </div>
      )}

      {/* Warning raised after each recorded violation */}
      {proctor.lastViolation && !needsFullscreen && (
        <div className="fixed inset-0 z-[55] bg-gray-950/80 backdrop-blur-sm flex items-center justify-center px-4" role="alertdialog" aria-modal="true">
          <Card className="max-w-md w-full text-center shadow-pop border-red-200 dark:border-red-500/30">
            <ShieldAlert className="h-10 w-10 text-red-500 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Warning {proctor.lastViolation.index}
              {proctor.settings.maxViolations > 0 ? ` of ${proctor.settings.maxViolations}` : ''}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {VIOLATION_LABELS[proctor.lastViolation.type] || 'Suspicious activity detected'}
            </p>
            <p className="text-xs text-gray-400 mb-6">
              {proctor.remaining === null
                ? 'This has been recorded on your attempt.'
                : proctor.remaining > 0
                  ? `${proctor.remaining} warning${proctor.remaining === 1 ? '' : 's'} left before your quiz is submitted automatically.`
                  : 'Your quiz is being submitted.'}
            </p>
            <Button fullWidth variant="secondary" onClick={proctor.dismissWarning}>Continue quiz</Button>
          </Card>
        </div>
      )}

      {/* ── Sticky status bar ── */}
      <div className="sticky top-16 z-30 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{quiz.title}</p>
            <div className="flex items-center gap-3 mt-1">
              <ProgressBar value={answeredCount} max={questions.length} size="sm" className="max-w-56" label="Questions answered" />
              <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap">{answeredCount}/{questions.length} answered</span>
            </div>
          </div>
          {proctoringOn && (
            <span className={`hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-semibold ${
              proctor.violationCount === 0
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400'
            }`}>
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {proctor.remaining === null ? `${proctor.violationCount} logged` : `${proctor.remaining} warnings left`}
            </span>
          )}
          {timerPill}
          <Button size="sm" variant="success" icon={Send} className="h-9 hidden sm:inline-flex" onClick={() => setShowSubmitConfirm(true)} loading={submitting}>
            Submit
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 grid lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* ── Question ── */}
        <Card className="sm:p-8" key={currentQuestion._id}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              Question {currentQuestionIndex + 1} <span className="text-gray-400 dark:text-gray-500">of {questions.length}</span>
            </p>
            <button type="button" onClick={() => toggleFlag(currentQuestion._id)} aria-pressed={isFlagged}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                isFlagged
                  ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}>
              <Flag className={`h-3.5 w-3.5 ${isFlagged ? 'fill-current' : ''}`} aria-hidden="true" />
              {isFlagged ? 'Flagged' : 'Flag for review'}
            </button>
          </div>

          <h2 id="question-text" className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white leading-relaxed whitespace-pre-line animate-fade-in">
            {currentQuestion.text}
          </h2>

          <div role="radiogroup" aria-labelledby="question-text" className="mt-6 space-y-3">
            {currentQuestion.options.map((option, i) => {
              const isSelected = answers[currentQuestion._id] === option._id;
              return (
                <button key={option._id} type="button" role="radio" aria-checked={isSelected}
                  onClick={() => handleAnswerSelect(currentQuestion._id, option._id)}
                  className={`group w-full text-left px-4 py-3.5 rounded-xl border-2 flex items-center gap-3.5 text-[15px] ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-500/10 text-gray-900 dark:text-white'
                      : 'border-gray-200 dark:border-gray-700/80 text-gray-700 dark:text-gray-300 hover:border-brand-200 dark:hover:border-brand-500/40 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}>
                  <span className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold shrink-0 ${
                    isSelected
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 group-hover:border-brand-300'
                  }`}>
                    {isSelected ? <Check className="h-4 w-4" aria-hidden="true" /> : LETTERS[i]}
                  </span>
                  <span className="flex-1">{option.text}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <Button variant="secondary" icon={ArrowLeft} onClick={goToPreviousQuestion} disabled={currentQuestionIndex === 0}>
              Previous
            </Button>
            {isLast ? (
              <Button variant="success" icon={Send} onClick={() => setShowSubmitConfirm(true)} loading={submitting}>Review & submit</Button>
            ) : (
              <Button iconRight={ArrowRight} onClick={goToNextQuestion}>Next</Button>
            )}
          </div>
        </Card>

        {/* ── Palette ── */}
        <aside className="lg:sticky lg:top-36 space-y-4" aria-label="Question navigator">
          <Card className="p-5 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Questions</h2>
              {flaggedOpen > 0 && <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{flaggedOpen} flagged</span>}
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-6 gap-2">
              {questions.map((q, index) => {
                const isAnswered = answers[q._id] !== null;
                const isCurrent = currentQuestionIndex === index;
                const isFlag = flagged.has(q._id);
                return (
                  <button key={q._id} type="button" onClick={() => setCurrentQuestionIndex(index)}
                    aria-label={`Question ${index + 1}${isAnswered ? ', answered' : ', not answered'}${isFlag ? ', flagged' : ''}`}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`relative h-9 rounded-lg text-xs font-semibold tabular-nums ${
                      isCurrent
                        ? 'bg-brand-600 text-white ring-2 ring-brand-600/30 ring-offset-2 ring-offset-white dark:ring-offset-gray-900'
                        : isAnswered
                          ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-500/25'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}>
                    {index + 1}
                    {isFlag && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-gray-900" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            <ul className="mt-5 grid grid-cols-2 gap-2 text-[11px] text-gray-500 dark:text-gray-400">
              <li className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-600" aria-hidden="true" />Current</li>
              <li className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-100 dark:bg-brand-500/25" aria-hidden="true" />Answered</li>
              <li className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700" aria-hidden="true" />Not answered</li>
              <li className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" aria-hidden="true" />Flagged</li>
            </ul>
            <Button variant="success" fullWidth icon={Send} className="mt-5 sm:hidden lg:inline-flex" onClick={() => setShowSubmitConfirm(true)} loading={submitting}>
              Submit quiz
            </Button>
          </Card>
          <p className="hidden lg:flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
            <kbd className="kbd">A–D</kbd> answer <kbd className="kbd">←</kbd><kbd className="kbd">→</kbd> move <kbd className="kbd">F</kbd> flag
          </p>
        </aside>
      </div>

      <ConfirmDialog
        open={showSubmitConfirm}
        title="Submit quiz?"
        message={
          answeredCount < questions.length
            ? `You've answered ${answeredCount} of ${questions.length} questions. Unanswered questions will be marked incorrect.${flaggedOpen ? ` ${flaggedOpen} question${flaggedOpen > 1 ? 's are' : ' is'} still flagged.` : ''} Submit anyway?`
            : flaggedOpen
              ? `All questions answered, but ${flaggedOpen} ${flaggedOpen > 1 ? 'are' : 'is'} flagged for review. You can't change answers after submitting.`
              : 'You can\'t change your answers after submitting. Ready to submit?'
        }
        confirmLabel="Submit"
        cancelLabel="Keep working"
        destructive={answeredCount < questions.length}
        busy={submitting}
        onConfirm={() => { setShowSubmitConfirm(false); submitQuiz(); }}
        onCancel={() => setShowSubmitConfirm(false)}
      />
    </div>
  );
};

export default TakeQuiz;
