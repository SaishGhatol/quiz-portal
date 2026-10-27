import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import AuthContext from '../../contexts/AuthContext';
import {
  ArrowLeft, Award, CheckCircle2, XCircle, Clock, Repeat, Printer, Star, MinusCircle, LayoutDashboard, Compass, Share2, Lock, Lightbulb, Dumbbell,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useReactToPrint } from 'react-to-print';
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon
} from 'react-share';
import { Button, Card, Badge, ProgressRing, Tabs, ErrorState, Spinner, EmptyState } from '../ui';
import { scoreTone, formatDuration, DEFAULT_PASS } from '../../utils/quiz';

// Animates a number from 0 up to `end`
const useCountUp = (end, duration = 1200) => {
  const [count, setCount] = useState(0);
  const frameRate = 1000 / 60;
  const totalFrames = Math.round(duration / frameRate);

  useEffect(() => {
    let frame = 0;
    const counter = setInterval(() => {
      frame++;
      const progress = (frame / totalFrames);
      // Ease-out quint for a smoother finish
      const easedProgress = 1 - Math.pow(1 - progress, 5);
      setCount(Math.round(end * easedProgress));

      if (frame === totalFrames) {
        clearInterval(counter);
      }
    }, frameRate);

    return () => clearInterval(counter);
  }, [end, duration, totalFrames, frameRate]);

  return count;
};

// --- Printable certificate ---
const Certificate = ({ quizTitle, userName, scorePercentage, completionDate, onBack }) => {
  const certificateRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: certificateRef,
    documentTitle: `${userName} - ${quizTitle} Certificate`,
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 0.5in;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }
    `,
  });

  const formattedDate = new Date(completionDate).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-100 dark:bg-gray-950 py-10 px-4 flex flex-col items-center">
      {/* Controls — hidden when printing */}
      <div className="w-full max-w-4xl flex justify-between items-center gap-3 mb-6 print:hidden">
        <Button variant="secondary" icon={ArrowLeft} onClick={onBack}>Back to results</Button>
        <Button icon={Printer} onClick={handlePrint}>Print / Save as PDF</Button>
      </div>

      {/* The printable certificate */}
      <div
        ref={certificateRef}
        className="bg-white w-full max-w-4xl shadow-pop rounded-lg overflow-hidden print:shadow-none print:rounded-none print:max-w-none"
        style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
      >
        <div className="h-3" style={{ background: 'linear-gradient(90deg, #b45309, #d97706, #b45309)' }} />

        <div className="px-6 sm:px-12 py-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Star size={22} className="text-amber-500 fill-amber-500" />
            <h1 className="text-lg sm:text-2xl font-bold tracking-widest text-gray-700 uppercase">Certificate of Achievement</h1>
            <Star size={22} className="text-amber-500 fill-amber-500" />
          </div>

          <p className="text-gray-500 text-base mb-3">This certificate is proudly presented to</p>
          <p className="text-4xl sm:text-5xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            {userName}
          </p>
          <div className="w-48 h-0.5 bg-amber-500 mx-auto mb-6" />

          <p className="text-gray-500 mb-2">for successfully completing</p>
          <p className="text-2xl font-bold text-amber-700 mb-6">"{quizTitle}"</p>
          <p className="text-gray-600 text-base">
            with a score of{' '}
            <span className="font-bold text-gray-900 text-xl">{scorePercentage}%</span>
            {' '}on{' '}
            <span className="font-semibold text-gray-800">{formattedDate}</span>
          </p>

          <div className="mt-14 flex justify-center">
            <div className="text-center">
              <div className="w-40 border-t border-gray-400 pt-2 mx-auto">
                <p className="text-sm font-semibold text-gray-700">ExamVault</p>
                <p className="text-xs text-gray-400">Authorised Issuer</p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-3" style={{ background: 'linear-gradient(90deg, #b45309, #d97706, #b45309)' }} />
      </div>
    </div>
  );
};

// The server stores the chosen option's text (selectedAnswer); older clients sent an id
const chosenOption = (question, answer) => {
  if (!question?.options || !answer) return null;
  return question.options.find(o =>
    (answer.selectedOptionId && o._id === answer.selectedOptionId) ||
    (answer.selectedAnswer && o.text === answer.selectedAnswer)
  ) || null;
};

const QuizResults = () => {
  const { attemptId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showCertificate, setShowCertificate] = useState(false);
  // While an assignment still has attempts left, the server withholds the correct answers
  const [reviewLocked, setReviewLocked] = useState(false);

  const fetchAttemptDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/quizzes/attempts/${attemptId}`);
      setAttempt(response.data.attempt);
      setQuiz(response.data.quiz);
      setQuestions(response.data.quiz?.questions || []);
      setReviewLocked(!!response.data.reviewLocked);
      setError(null);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError(err.response?.data?.message || 'Failed to load quiz results. The attempt may not exist or an error occurred.');
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => { fetchAttemptDetails(); }, [fetchAttemptDetails]);

  const scorePercentage = attempt?.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;
  // Use the quiz's own passScore (percentage); default if not set
  const passingThreshold = quiz?.passScore ?? DEFAULT_PASS;
  const hasPassed = scorePercentage >= passingThreshold;

  // Celebrate a pass — once, and not for users who prefer reduced motion
  useEffect(() => {
    if (loading || !hasPassed) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, zIndex: 1000 });
  }, [loading, hasPassed]);

  const answers = attempt?.answers || [];
  const answerFor = qid => answers.find(a => String(a.questionId) === String(qid));
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const unanswered = questions.filter(q => !chosenOption(q, answerFor(q._id))).length;
  const incorrectAnswers = Math.max(0, questions.length - correctAnswers - unanswered);

  const animatedScore = useCountUp(scorePercentage);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Spinner label="Calculating your results" />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <ErrorState title={error ? 'Couldn\'t load results' : 'Attempt not found'}
            message={error || 'We couldn\'t find any data for this quiz attempt.'}
            onRetry={error ? fetchAttemptDetails : undefined}
            action={<Button variant="ghost" icon={ArrowLeft} to="/quizzes">Back to quizzes</Button>} />
        </Card>
      </div>
    );
  }

  if (showCertificate) {
    return (
      <Certificate
        quizTitle={quiz.title}
        userName={currentUser?.name || 'Quiz Taker'}
        scorePercentage={scorePercentage}
        completionDate={attempt.completedAt}
        onBack={() => setShowCertificate(false)}
      />
    );
  }

  const shareUrl = window.location.href;
  const shareTitle = `I scored ${scorePercentage}% on the "${quiz.title}" quiz! Challenge me!`;
  const shareHashtags = ['QuizChallenge', quiz.title.replace(/\s+/g, '')];

  const timeTakenSec = (new Date(attempt.completedAt) - new Date(attempt.startedAt)) / 1000;
  const tone = scoreTone(scorePercentage);

  const headline = hasPassed
    ? scorePercentage >= 90 ? 'Outstanding result' : scorePercentage >= 75 ? 'Great work' : 'You passed'
    : scorePercentage >= passingThreshold - 10 ? 'So close — try again' : 'Keep practising';
  const subline = hasPassed
    ? 'Your certificate is ready. Review the answers below to lock in what you learned.'
    : `You need ${passingThreshold}% to pass. Review your answers below, then have another go.`;

  const stats = [
    { label: 'Correct',    value: correctAnswers,   icon: CheckCircle2, cls: 'text-emerald-500' },
    { label: 'Incorrect',  value: incorrectAnswers, icon: XCircle,      cls: 'text-red-500' },
    { label: 'Skipped',    value: unanswered,       icon: MinusCircle,  cls: 'text-gray-400' },
    { label: 'Time taken', value: formatDuration(timeTakenSec), icon: Clock, cls: 'text-brand-500' },
  ];

  const reviewed = questions.map((question, index) => {
    const answer = answerFor(question._id);
    const picked = chosenOption(question, answer);
    const status = !picked ? 'skipped' : answer?.isCorrect ? 'correct' : 'incorrect';
    return { question, index, answer, picked, status };
  });
  const visible = reviewed.filter(r => filter === 'all' || r.status === filter || (filter === 'incorrect' && r.status === 'skipped'));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6 animate-fade-up">

        {/* ── Score summary ── */}
        <Card className="sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className="flex flex-col items-center shrink-0">
              <ProgressRing value={scorePercentage} size={168} stroke={12} tone={tone} label={`Score ${scorePercentage}%`}>
                <span className="text-4xl font-extrabold font-display text-gray-900 dark:text-white tabular-nums">{animatedScore}%</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 tabular-nums">{attempt.score}/{attempt.maxScore} points</span>
              </ProgressRing>
            </div>

            <div className="flex-1 min-w-0 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap mb-3">
                <Badge tone={hasPassed ? 'green' : 'red'} icon={hasPassed ? CheckCircle2 : XCircle}>
                  {hasPassed ? 'Passed' : 'Not passed'}
                </Badge>
                <span className="text-xs text-gray-500 dark:text-gray-400">Pass mark {passingThreshold}%</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{headline}</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">{quiz.title}</span> · {subline}
              </p>

              <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map(s => (
                  <div key={s.label} className="rounded-xl bg-gray-50 dark:bg-gray-800/60 px-3.5 py-3 text-left">
                    <dt className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <s.icon className={`h-3.5 w-3.5 ${s.cls}`} aria-hidden="true" />{s.label}
                    </dt>
                    <dd className="mt-1 text-lg font-bold font-display text-gray-900 dark:text-white tabular-nums">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-2 sm:items-center">
            {hasPassed && (
              <Button icon={Award} onClick={() => setShowCertificate(true)}>View certificate</Button>
            )}
            <Button to={`/quiz/${quiz._id}`} variant={hasPassed ? 'secondary' : 'primary'} icon={Repeat}>Try again</Button>
            <Button to="/dashboard" variant="secondary" icon={LayoutDashboard}>Dashboard</Button>
            {incorrectAnswers + unanswered > 0 && !reviewLocked && (
              <Button to="/practice/mistakes" variant="secondary" icon={Dumbbell}>Fix your mistakes</Button>
            )}
            <Button to="/quizzes" variant="ghost" icon={Compass} className="sm:ml-auto">More quizzes</Button>
          </div>
        </Card>

        {/* ── Share ── */}
        <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 sm:py-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Share2 className="h-4 w-4 text-gray-400" aria-hidden="true" /> Share your result
          </p>
          <div className="flex items-center gap-2.5">
            <TwitterShareButton url={shareUrl} title={shareTitle} hashtags={shareHashtags} aria-label="Share on X / Twitter">
              <TwitterIcon size={34} round />
            </TwitterShareButton>
            <FacebookShareButton url={shareUrl} quote={shareTitle} hashtag={`#${shareHashtags[0]}`} aria-label="Share on Facebook">
              <FacebookIcon size={34} round />
            </FacebookShareButton>
            <LinkedinShareButton url={shareUrl} title={shareTitle}
              summary="Check out my quiz results and try the quiz yourself!" source="ExamVault" aria-label="Share on LinkedIn">
              <LinkedinIcon size={34} round />
            </LinkedinShareButton>
            <WhatsappShareButton url={shareUrl} title={shareTitle} separator=" :: " aria-label="Share on WhatsApp">
              <WhatsappIcon size={34} round />
            </WhatsappShareButton>
          </div>
        </Card>

        {/* ── Answer review ── */}
        <section aria-labelledby="review-heading">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 id="review-heading" className="text-xl font-bold text-gray-900 dark:text-white">Answer review</h2>
            <Tabs label="Filter answers" value={filter} onChange={setFilter} options={[
              { value: 'all',       label: 'All',       count: reviewed.length },
              { value: 'correct',   label: 'Correct',   count: correctAnswers },
              { value: 'incorrect', label: 'Needs work', count: incorrectAnswers + unanswered },
            ]} />
          </div>

          {reviewLocked && (
            <div role="status" className="mb-4 flex gap-3 rounded-2xl border border-brand-200 dark:border-brand-500/20 bg-brand-50 dark:bg-brand-500/10 px-4 py-3 text-sm text-brand-900 dark:text-brand-200">
              <Lock className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <p>This is an assignment and you still have attempts left, so correct answers stay hidden for now. You can see which questions you got right — the answers unlock after your final attempt or when the assignment closes.</p>
            </div>
          )}

          {visible.length === 0 ? (
            <Card>
              <EmptyState compact icon={filter === 'correct' ? MinusCircle : CheckCircle2}
                title={filter === 'correct' ? 'No correct answers this time' : 'Nothing to fix — every answer was right'} />
            </Card>
          ) : (
            <ol className="space-y-4">
              {visible.map(({ question, index, picked, status }) => (
                <li key={question._id}>
                  <Card className={`border-l-4 ${
                    status === 'correct' ? 'border-l-emerald-500' : status === 'incorrect' ? 'border-l-red-500' : 'border-l-gray-300 dark:border-l-gray-600'
                  }`}>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <p className="font-semibold text-gray-900 dark:text-white leading-relaxed whitespace-pre-line">
                        <span className="text-gray-400 mr-2 tabular-nums">{index + 1}.</span>{question.text}
                      </p>
                      <Badge tone={status === 'correct' ? 'green' : status === 'incorrect' ? 'red' : 'gray'} className="shrink-0">
                        {status === 'correct' ? 'Correct' : status === 'incorrect' ? 'Incorrect' : 'Skipped'}
                      </Badge>
                    </div>
                    <ul className="space-y-2">
                      {(question.options || []).map(o => {
                        const isPicked = picked && o._id === picked._id;
                        const isRight = reviewLocked ? isPicked && status === 'correct' : o.isCorrect;
                        return (
                          <li key={o._id}
                            className={`flex items-start gap-3 px-3.5 py-2.5 rounded-xl border text-sm ${
                              isRight
                                ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-gray-900 dark:text-white'
                                : isPicked
                                  ? 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-gray-900 dark:text-white'
                                  : 'border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400'
                            }`}>
                            {isRight
                              ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                              : isPicked
                                ? <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                                : <span className="w-4 h-4 shrink-0" aria-hidden="true" />}
                            <span className="flex-1">{o.text}</span>
                            {isPicked && <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 shrink-0">Your answer</span>}
                            {isRight && !isPicked && <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 shrink-0">Correct</span>}
                          </li>
                        );
                      })}
                    </ul>
                    {question.explanation && !reviewLocked && (
                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 flex gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />{question.explanation}
                      </p>
                    )}
                  </Card>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="text-center pt-2">
          <Link to="/my-attempts" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">See all my attempts</Link>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
