import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
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
    <div className="bg-gray-950 min-h-screen py-12 px-4 flex flex-col items-center justify-center animate-fade-in">
      {/* Buttons - NOT included in print */}
      <div className="w-full max-w-5xl mx-auto flex justify-between items-center mb-8 print:hidden">
        <button onClick={onBack} className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-semibold transition-all transform hover:scale-105">
          <ArrowLeft size={16} />
          Back to Results
        </button>
        <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-all transform hover:scale-105">
          <Printer size={16} />
          Print / Download PDF
        </button>
      </div>

      {/* Certificate - ONLY this div will be printed */}
      <div 
        ref={certificateRef} 
        className="bg-white border-4 border-yellow-500 p-12 max-w-4xl w-full aspect-[1.414/1] flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden print:shadow-none print:max-w-none print:w-full print:h-full print:aspect-auto"
        style={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact'
        }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 left-8 text-6xl text-yellow-500">★</div>
          <div className="absolute top-8 right-8 text-6xl text-yellow-500">★</div>
          <div className="absolute bottom-8 left-8 text-6xl text-yellow-500">★</div>
          <div className="absolute bottom-8 right-8 text-6xl text-yellow-500">★</div>
        </div>
        
        {/* Certificate content */}
        <div className="flex items-center gap-4 text-yellow-600 z-10 mb-8">
          <Star size={32} />
          <h1 className="text-4xl font-serif font-bold text-gray-800">Certificate of Achievement</h1>
          <Star size={32} />
        </div>
        
        <p className="text-xl text-gray-600 z-10 mb-6">This certificate is proudly presented to</p>
        <p className="text-5xl font-extrabold text-gray-800 my-8 font-sans z-10 border-b-2 border-yellow-500 pb-4">{userName}</p>
        <p className="text-xl text-gray-600 z-10 mb-2">for successfully completing the quiz</p>
        <p className="text-3xl font-bold text-yellow-600 mt-2 z-10 mb-8">{quizTitle}</p>
        <p className="text-lg text-gray-600 z-10">
          with a score of <span className="font-bold text-gray-800 text-xl">{scorePercentage}%</span> on <span className="font-bold text-gray-800">{formattedDate}</span>
        </p>
        
        <div className="mt-16 w-full flex justify-center z-10">
          <div className="text-center">
            <div className="border-t-2 border-gray-400 pt-2 px-12">
              <p className="text-lg font-semibold text-gray-800">Quiz Portal</p>
              <p className="text-sm text-gray-500">Authorized Issuer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuizResults = () => {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  const PASSING_SCORE = 80;

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
  const hasPassed = scorePercentage >= PASSING_SCORE;

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
      <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
        <AlertTriangle className="h-12 w-12 text-red-500/50 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Error Loading Results</h3>
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
      <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
        <SearchX className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Attempt Not Found</h3>
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
        userName="Alex Doe" 
        scorePercentage={scorePercentage}
        completionDate={attempt.completedAt}
        onBack={() => setShowCertificate(false)}
      />
    );
  }

  // Determine colors based on score
  const scoreColor = scorePercentage >= 80 ? 'text-green-400' : scorePercentage >= 50 ? 'text-yellow-400' : 'text-red-400';
  const scoreStroke = scorePercentage >= 80 ? 'stroke-green-500' : scorePercentage >= 50 ? 'stroke-yellow-500' : 'stroke-red-500';
  const shadowColor = hasPassed ? 'shadow-green-500/20' : 'shadow-gray-500/10';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">{quiz.title}</h1>
        <p className="mt-2 text-lg text-gray-400">Here's your performance breakdown.</p>
      </div>

      <div className={`bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl ${shadowColor} transition-shadow duration-500`}>
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
                <circle cx="50" cy="50" r="45" strokeWidth="10" fill="none" className="stroke-gray-800" />
                <circle
                  cx="50" cy="50" r="45" strokeWidth="10" fill="none"
                  className={`${scoreStroke} transition-all duration-1000 ease-out`}
                  strokeDasharray={`${(scorePercentage * 2.83)} 283`}
                  strokeLinecap="round" transform="rotate(-90 50 50)"
                  style={{ filter: 'url(#glow)' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-white drop-shadow-lg">{animatedScore}%</span>
                <span className="text-sm text-gray-400 mt-1">Score</span>
              </div>
            </div>
             <p className={`mt-4 text-2xl font-semibold ${scoreColor}`}>
              {scorePercentage >= 80 ? "Excellent Work! 🎉" : scorePercentage >= 50 ? "Good Effort!" : "Keep Practicing!"}
            </p>
          </div>
          <div className="md:col-span-3 grid grid-cols-2 gap-4">
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800/80 transition-all hover:border-green-500/50 hover:bg-gray-800/50">
              <div className="flex items-center gap-3 text-green-400 mb-2"><CheckCircle2 size={20} /> <span className="text-sm font-medium text-gray-400">Correct</span></div>
              <p className="font-semibold text-3xl text-white">{animatedCorrect} <span className="text-base text-gray-500">/{questions.length}</span></p>
            </div>
             <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800/80 transition-all hover:border-red-500/50 hover:bg-gray-800/50">
              <div className="flex items-center gap-3 text-red-400 mb-2"><XCircle size={20} /> <span className="text-sm font-medium text-gray-400">Incorrect</span></div>
              <p className="font-semibold text-3xl text-white">{animatedIncorrect} <span className="text-base text-gray-500">/{questions.length}</span></p>
            </div>
             <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800/80 transition-all hover:border-yellow-500/50 hover:bg-gray-800/50">
              <div className="flex items-center gap-3 text-yellow-400 mb-2"><Award size={20} /> <span className="text-sm font-medium text-gray-400">Points</span></div>
              <p className="font-semibold text-3xl text-white">{animatedPoints} <span className="text-base text-gray-500">/{attempt.maxScore}</span></p>
            </div>
             <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800/80 transition-all hover:border-blue-500/50 hover:bg-gray-800/50">
              <div className="flex items-center gap-3 text-blue-400 mb-2"><Clock size={20} /> <span className="text-sm font-medium text-gray-400">Time</span></div>
              <p className="font-semibold text-3xl text-white">{formatTime(timeTakenMs)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center flex-wrap gap-4 mb-10">
        {hasPassed && (
          <button onClick={() => setShowCertificate(true)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-yellow-500/30">
            <Award size={18} />
            View Certificate
          </button>
        )}
        <button onClick={() => setShowAnswers(!showAnswers)} className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold transition-all transform hover:scale-105 hover:bg-gray-700">
          <BarChart3 size={18} />
          {showAnswers ? 'Hide' : 'Review'} Answers
          <ChevronDown size={18} className={`transition-transform ${showAnswers ? 'rotate-180' : ''}`} />
        </button>
        <Link to={`/quiz/${quiz._id}`} className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold transition-all transform hover:scale-105 hover:bg-gray-700">
          <Repeat size={18} />
          Try Again
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
        <div className="space-y-4 animate-fade-in-up">
          <h2 className="text-3xl font-bold text-white text-center">Detailed Review</h2>
          {questions.map((question, index) => {
            const userAnswer = attempt.answers.find(a => a.questionId === question._id);
            const isCorrect = userAnswer?.isCorrect || false;

            return (
              <div key={question._id} className={`bg-gray-950/80 border-l-4 rounded-r-lg p-5 transition-colors ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                <p className="font-semibold text-white mb-4 text-lg">
                  <span className="text-gray-500 mr-2">{index + 1}.</span>{question.text}
                </p>
                <div className="space-y-3 pl-7">
                  <div className={`border border-transparent p-3 rounded-lg flex items-start gap-3 ${isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {isCorrect ? <CheckCircle2 size={20} className="text-green-400 mt-0.5 flex-shrink-0" /> : <XCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />}
                    <div>
                      <p className="text-sm font-medium text-gray-400">Your Answer</p>
                      <p className="text-white text-base">{userAnswer ? getOptionText(question._id, userAnswer.selectedOptionId) : 'Not Answered'}</p>
                    </div>
                  </div>
                  {!isCorrect && (
                     <div className="border border-transparent p-3 rounded-lg bg-green-500/10 flex items-start gap-3">
                       <CheckCircle2 size={20} className="text-green-400 mt-0.5 flex-shrink-0" />
                       <div>
                         <p className="text-sm font-medium text-gray-400">Correct Answer</p>
                         <p className="text-white text-base">{getCorrectOptionText(question._id)}</p>
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
  );
};

export default QuizResults;