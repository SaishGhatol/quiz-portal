import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import AuthContext from '../../contexts/AuthContext';
import { Loader, AlertTriangle, SearchX, ArrowLeft, Award, CheckCircle2, XCircle, Clock, ChevronDown, BarChart3, Repeat, Printer, Star } from "lucide-react";
import confetti from 'canvas-confetti';
import { useReactToPrint } from 'react-to-print';
// +++ NEW: Import social sharing components +++
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


// +++ NEW: Custom hook for animating numbers +++
const useCountUp = (end, duration = 1500) => {
  const [count, setCount] = useState(0);
  const frameRate = 1000 / 60;
  const totalFrames = Math.round(duration / frameRate);

  useEffect(() => {
    let frame = 0;
    const counter = setInterval(() => {
      frame++;
      const progress = (frame / totalFrames);
      // Ease-out quint function for a smoother animation
      const easedProgress = 1 - Math.pow(1 - progress, 5);
      setCount(Math.round(end * easedProgress));

      if (frame === totalFrames) {
        clearInterval(counter);
      }
    }, frameRate);

    return () => clearInterval(counter);
  }, [end, duration, totalFrames]);

  return count;
};

// --- Enhanced Certificate Component ---
const Certificate = ({ quizTitle, userName, scorePercentage, completionDate, onBack }) => {
  const certificateRef = useRef(null);

  // Fixed: Properly configure react-to-print with custom styles
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-12 px-4 flex flex-col items-center">
      {/* Controls — hidden when printing */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-6 print:hidden">
        <button onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-100 dark:bg-gray-800 text-sm font-semibold rounded-lg transition-colors">
          <ArrowLeft size={16} /> Back to Results
        </button>
        <button onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-gray-900 dark:text-white text-sm font-semibold rounded-lg transition-colors">
          <Printer size={16} /> Print / Save as PDF
        </button>
      </div>

      {/* The printable certificate */}
      <div
        ref={certificateRef}
        className="bg-white w-full max-w-4xl shadow-xl rounded-lg overflow-hidden print:shadow-none print:rounded-none print:max-w-none"
        style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
      >
        {/* Gold top border */}
        <div className="h-3" style={{ background: 'linear-gradient(90deg, #b45309, #d97706, #b45309)' }} />

        <div className="px-12 py-12 text-center">
          {/* Header */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Star size={24} className="text-amber-500 fill-amber-500" />
            <h1 className="text-2xl font-bold tracking-widest text-gray-700 uppercase">Certificate of Achievement</h1>
            <Star size={24} className="text-amber-500 fill-amber-500" />
          </div>

          {/* Presented to */}
          <p className="text-gray-500 text-base mb-3">This certificate is proudly presented to</p>
          <p className="text-5xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            {userName}
          </p>
          <div className="w-48 h-0.5 bg-amber-500 mx-auto mb-6" />

          {/* Quiz info */}
          <p className="text-gray-500 mb-2">for successfully completing</p>
          <p className="text-2xl font-bold text-amber-700 mb-6">"{quizTitle}"</p>
          <p className="text-gray-600 text-base">
            with a score of{' '}
            <span className="font-bold text-gray-900 text-xl">{scorePercentage}%</span>
            {' '}on{' '}
            <span className="font-semibold text-gray-800">{formattedDate}</span>
          </p>

          {/* Signature */}
          <div className="mt-14 flex justify-center">
            <div className="text-center">
              <div className="w-40 border-t border-gray-400 pt-2 mx-auto">
                <p className="text-sm font-semibold text-gray-700">Quiz Portal</p>
                <p className="text-xs text-gray-400">Authorised Issuer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gold bottom border */}
        <div className="h-3" style={{ background: 'linear-gradient(90deg, #b45309, #d97706, #b45309)' }} />
      </div>
    </div>
  );
};

const QuizResults = () => {
  const { attemptId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    const fetchAttemptDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/quizzes/attempts/${attemptId}`);
        setAttempt(response.data.attempt);
        setQuiz(response.data.quiz);
        setQuestions(response.data.quiz?.questions || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching results:", err);
        setError('Failed to load quiz results. The attempt may not exist or an error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchAttemptDetails();
  }, [attemptId]);

  const scorePercentage = attempt?.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;
  // Use the quiz's own passScore (percentage); default to 40 if not set
  const passingThreshold = quiz?.passScore ?? 40;
  const hasPassed = scorePercentage >= passingThreshold;

  // +++ NEW: Trigger confetti on pass +++
  useEffect(() => {
    if (!loading && hasPassed) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        zIndex: 1000,
      });
    }
  }, [loading, hasPassed]);

  // +++ NEW: Animated stats +++
  const animatedScore = useCountUp(scorePercentage);
  const correctAnswers = attempt?.answers.filter(a => a.isCorrect).length || 0;
  const animatedCorrect = useCountUp(correctAnswers);
  const incorrectAnswers = (attempt?.answers.length || 0) - correctAnswers;
  const animatedIncorrect = useCountUp(incorrectAnswers);
  const animatedPoints = useCountUp(attempt?.score || 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
        <Loader className="animate-spin h-8 w-8 mb-4" />
        <p className="font-semibold text-lg">Calculating Your Results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
        <AlertTriangle className="h-12 w-12 text-red-500/50 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Results</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link to="/quizzes" className="inline-flex items-center gap-2 px-5 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors">
          <ArrowLeft size={16} />
          Back to Quizzes
        </Link>
      </div>
    </div>
    );
  }

  if (!attempt) {
    return (   <div className="min-h-[50vh] flex items-center justify-center">
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
        <SearchX className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Attempt Not Found</h3>
        <p className="text-gray-500 mb-6">We couldn't find any data for this quiz attempt.</p>
        <Link to="/quizzes" className="inline-flex items-center gap-2 px-5 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors">
          <ArrowLeft size={16} />
          Back to Quizzes
        </Link>
      </div>
    </div>);
  }

  // +++ NEW: Social Sharing configuration +++
  const shareUrl = window.location.href;
  const shareTitle = `I scored ${scorePercentage}% on the "${quiz.title}" quiz! Challenge me!`;
  const shareHashtags = ['QuizChallenge', quiz.title.replace(/\s+/g, '')];

  const timeTakenMs = new Date(attempt.completedAt) - new Date(attempt.startedAt);
  
  const formatTime = (ms) => {
    if (isNaN(ms) || ms < 0) return 'N/A';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const getOptionText = (questionId, optionId) => {
    const question = questions.find(q => q._id === questionId);
    if (!question || !question.options) return 'N/A';
    const option = question.options.find(o => o._id === optionId);
    return option ? option.text : 'N/A';
  };

  const getCorrectOptionText = (questionId) => {
    const question = questions.find(q => q._id === questionId);
    if (!question || !question.options) return 'N/A';
    const correctOption = question.options.find(o => o.isCorrect);
    return correctOption ? correctOption.text : 'N/A';
  };
  
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

  // Determine colors based on score
  const scoreColor = scorePercentage >= 80 ? 'text-green-500 dark:text-green-400' : scorePercentage >= 50 ? 'text-amber-500 dark:text-yellow-400' : 'text-red-500 dark:text-red-400';
  const scoreStroke = scorePercentage >= 80 ? 'stroke-green-500' : scorePercentage >= 50 ? 'stroke-amber-500' : 'stroke-red-500';
  const shadowColor = hasPassed ? 'shadow-green-500/20' : 'shadow-gray-500/10';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 py-8 px-4">
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">{quiz.title}</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Here's your performance breakdown.</p>
      </div>

      <div className={`bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 md:p-8 mb-8 shadow-sm`}>
        <div className="grid md:grid-cols-5 gap-8 items-center">
          <div className="md:col-span-2 flex flex-col items-center justify-center">
            <div className="relative h-48 w-48">
              <svg className="h-full w-full" viewBox="0 0 100 100">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <circle cx="50" cy="50" r="45" strokeWidth="10" fill="none" className="stroke-gray-200 dark:stroke-gray-800" />
                <circle
                  cx="50" cy="50" r="45" strokeWidth="10" fill="none"
                  className={`${scoreStroke} transition-all duration-1000 ease-out`}
                  strokeDasharray={`${(scorePercentage * 2.83)} 283`}
                  strokeLinecap="round" transform="rotate(-90 50 50)"
                  style={{ filter: 'url(#glow)' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{animatedScore}%</span>
                <span className="text-xs text-gray-400 mt-1">Score</span>
              </div>
            </div>
             <p className={`mt-3 text-lg font-semibold ${scoreColor}`}>
              {scorePercentage >= 80 ? "Excellent Work! 🎉" : scorePercentage >= 50 ? "Good Effort! 👍" : "Keep Practicing! 💪"}
            </p>
          </div>
          <div className="md:col-span-3 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-green-500 mb-2"><CheckCircle2 size={16} /><span className="text-xs font-medium text-gray-500 dark:text-gray-400">Correct</span></div>
              <p className="font-bold text-2xl text-gray-900 dark:text-white">{animatedCorrect} <span className="text-sm text-gray-400">/{questions.length}</span></p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-red-500 mb-2"><XCircle size={16} /><span className="text-xs font-medium text-gray-500 dark:text-gray-400">Incorrect</span></div>
              <p className="font-bold text-2xl text-gray-900 dark:text-white">{animatedIncorrect} <span className="text-sm text-gray-400">/{questions.length}</span></p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-amber-500 mb-2"><Award size={16} /><span className="text-xs font-medium text-gray-500 dark:text-gray-400">Points</span></div>
              <p className="font-bold text-2xl text-gray-900 dark:text-white">{animatedPoints} <span className="text-sm text-gray-400">/{attempt.maxScore}</span></p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-blue-500 mb-2"><Clock size={16} /><span className="text-xs font-medium text-gray-500 dark:text-gray-400">Time</span></div>
              <p className="font-bold text-2xl text-gray-900 dark:text-white">{formatTime(timeTakenMs)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center flex-wrap gap-3 mb-8">
        {hasPassed && (
          <button onClick={() => setShowCertificate(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 dark:text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-md">
            <Award size={16} /> View Certificate
          </button>
        )}
        <button onClick={() => setShowAnswers(!showAnswers)} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <BarChart3 size={16} />
          {showAnswers ? 'Hide' : 'Review'} Answers
          <ChevronDown size={16} className={`transition-transform ${showAnswers ? 'rotate-180' : ''}`} />
        </button>
        <Link to={`/quiz/${quiz._id}`} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <Repeat size={16} /> Try Again
        </Link>
      </div>

      {/* +++ NEW: Social Sharing Section +++ */}
      <div className="text-center my-10 animate-fade-in-up">
        <p className="text-gray-400 font-semibold mb-4">Share Your Achievement!</p>
        <div className="flex justify-center items-center gap-4">
          <TwitterShareButton
            url={shareUrl}
            title={shareTitle}
            hashtags={shareHashtags}
            className="transition-transform transform hover:scale-110"
          >
            <TwitterIcon size={40} round />
          </TwitterShareButton>

          <FacebookShareButton
            url={shareUrl}
            quote={shareTitle}
            hashtag={`#${shareHashtags[0]}`}
            className="transition-transform transform hover:scale-110"
          >
            <FacebookIcon size={40} round />
          </FacebookShareButton>

          <LinkedinShareButton
            url={shareUrl}
            title={shareTitle}
            summary="Check out my quiz results and try the quiz yourself on this awesome platform!"
            source="React Quiz App"
            className="transition-transform transform hover:scale-110"
          >
            <LinkedinIcon size={40} round />
          </LinkedinShareButton>

          <WhatsappShareButton
            url={shareUrl}
            title={shareTitle}
            separator=" :: "
            className="transition-transform transform hover:scale-110"
          >
            <WhatsappIcon size={40} round />
          </WhatsappShareButton>
        </div>
      </div>

      {showAnswers && (
        <div className="space-y-4 animate-fade-up">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">Detailed Review</h2>
          {questions.map((question, index) => {
            const userAnswer = attempt.answers.find(a => a.questionId === question._id);
            const isCorrect = userAnswer?.isCorrect || false;
            return (
              <div key={question._id} className={`bg-white dark:bg-gray-900 border-l-4 border rounded-r-2xl p-5 ${isCorrect ? 'border-l-green-500 border-gray-100 dark:border-gray-800' : 'border-l-red-500 border-gray-100 dark:border-gray-800'}`}>
                <p className="font-semibold text-gray-900 dark:text-white mb-4">
                  <span className="text-gray-400 mr-2">{index + 1}.</span>{question.text}
                </p>
                <div className="space-y-2 pl-5">
                  <div className={`p-3 rounded-xl flex items-start gap-3 ${isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    {isCorrect ? <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" /> : <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />}
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-0.5">Your Answer</p>
                      <p className="text-sm text-gray-900 dark:text-white">{userAnswer ? getOptionText(question._id, userAnswer.selectedOptionId) : 'Not Answered'}</p>
                    </div>
                  </div>
                  {!isCorrect && (
                    <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-start gap-3">
                      <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-400 mb-0.5">Correct Answer</p>
                        <p className="text-sm text-gray-900 dark:text-white">{getCorrectOptionText(question._id)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </div>
  );
};

export default QuizResults;