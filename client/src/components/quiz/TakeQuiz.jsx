import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { Loader, AlertTriangle, SearchX, ArrowLeft, ArrowRight, Clock, Check, Flag, HelpCircle } from "lucide-react";

const TakeQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/quizzes/${id}/questions`);
        setQuiz(response.data.quiz);
        setQuestions(response.data.questions);
        const initialAnswers = {};
        response.data.questions.forEach(q => { initialAnswers[q._id] = null; });
        setAnswers(initialAnswers);
        if (response.data.quiz.timeLimit) {
          setTimeLeft(response.data.quiz.timeLimit * 60);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError('Failed to load the quiz. It might not exist or there was a server issue.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (quizStarted && timeLeft !== null) {
      const timer = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timer);
            submitQuiz();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quizStarted, timeLeft]);

  const startQuiz = () => {
    setQuizStarted(true);
    setStartTime(new Date());
  };

  const handleAnswerSelect = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
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

  const submitQuiz = async () => {
    const formattedAnswers = Object.entries(answers)
      .filter(([_, optionId]) => optionId !== null)
      .map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId }));

    const payload = {
      answers: formattedAnswers,
      startedAt: startTime.toISOString(),
      completedAt: new Date().toISOString()
    };
    
    try {
      const response = await api.post(`/quizzes/${id}/submit`, payload);
      toast.success('Quiz submitted successfully!', { theme: 'dark' });
      navigate(`/quiz/results/${response.data.attemptId}`);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      const errorMessage = err.response?.data?.message || 'Failed to submit quiz.';
      toast.error(errorMessage, { theme: 'dark' });
    }
  };

  const countAnsweredQuestions = () => Object.values(answers).filter(a => a !== null).length;
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-white dark:bg-gray-950 text-gray-500">
        <Loader className="animate-spin h-8 w-8 mb-4 text-blue-500" />
        <p className="font-semibold text-lg">Preparing Your Quiz…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] bg-white dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center shadow-sm">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Quiz</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!quiz || !questions.length) {
    return (
      <div className="min-h-[50vh] bg-white dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center shadow-sm">
          <SearchX className="h-12 w-12 text-gray-600 dark:text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Quiz Not Available</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">This quiz could not be found or contains no questions.</p>
          <button onClick={() => navigate('/quizzes')} className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors">
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-8">
        <div className="max-w-4xl w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm grid md:grid-cols-2 overflow-hidden">
          <div className="p-8 md:p-10">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-lg mb-4 capitalize">
              {quiz.difficulty}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight mb-3">{quiz.title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{quiz.description}</p>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-3"><HelpCircle size={16} className="text-gray-400"/><span>{questions.length} questions</span></div>
              {quiz.timeLimit > 0 && <div className="flex items-center gap-3"><Clock size={16} className="text-gray-400"/><span>{quiz.timeLimit} minute time limit</span></div>}
              <div className="flex items-center gap-3"><Check size={16} className="text-gray-400"/><span>Navigate freely between questions</span></div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-8 md:p-10 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Instructions</h3>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                <li className="flex items-start gap-2"><span className="mt-0.5 text-blue-500">·</span> Read each question carefully.</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-blue-500">·</span> You can go back and change answers.</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-blue-500">·</span> Your progress is shown in the sidebar.</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-blue-500">·</span> Submit only when you're ready.</li>
              </ul>
            </div>
            <button onClick={startQuiz} className="mt-8 w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-white font-bold rounded-xl transition-colors shadow-sm text-base">
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = (countAnsweredQuestions() / questions.length) * 100;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 py-6 px-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6 items-start">

        {/* Question card */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Question {currentQuestionIndex + 1} <span className="text-gray-600 dark:text-gray-300 dark:text-gray-600">/ {questions.length}</span>
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-white mb-6">{currentQuestion.text}</p>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion._id] === option._id;
              return (
                <button key={option._id} onClick={() => handleAnswerSelect(currentQuestion._id, option._id)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all flex items-center gap-3 font-medium text-sm
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                    ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                    {isSelected && <Check size={12} className="text-gray-900 dark:text-white" />}
                  </div>
                  {option.text}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:sticky top-20 space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
            <p className="font-bold text-gray-900 dark:text-white text-sm mb-4 truncate">{quiz.title}</p>

            {timeLeft !== null && (
              <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border mb-4 ${
                timeLeft < 60
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}>
                <span className="text-xs font-medium">Time Left</span>
                <span className="font-bold tabular-nums">{formatTime(timeLeft)}</span>
              </div>
            )}

            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Progress</span>
                <span>{countAnsweredQuestions()}/{questions.length}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${progressPercentage}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 mb-5">
              {questions.map((q, index) => {
                const isAnswered = answers[q._id] !== null;
                const isCurrent = currentQuestionIndex === index;
                return (
                  <button key={q._id} onClick={() => setCurrentQuestionIndex(index)}
                    className={`h-7 flex items-center justify-center rounded text-xs font-medium transition-colors
                      ${isCurrent ? 'bg-blue-600 text-white' : isAnswered ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button onClick={goToPreviousQuestion} disabled={currentQuestionIndex === 0}
                className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ArrowLeft size={15}/> Prev
              </button>
              {currentQuestionIndex < questions.length - 1 ? (
                <button onClick={goToNextQuestion}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-white transition-colors">
                  Next <ArrowRight size={15}/>
                </button>
              ) : (
                <button onClick={submitQuiz}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-gray-900 dark:text-white transition-colors">
                  <Flag size={15}/> Submit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeQuiz;
