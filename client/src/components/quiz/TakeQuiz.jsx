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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
        <Loader className="animate-spin h-8 w-8 mb-4" />
        <p className="font-semibold text-lg">Preparing Your Quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-500/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Quiz</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-5 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!quiz || !questions.length) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <SearchX className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Quiz Not Available</h3>
          <p className="text-gray-500 mb-6">This quiz could not be found or contains no questions.</p>
          <button onClick={() => navigate('/quizzes')} className="px-5 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors">
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl grid md:grid-cols-2 overflow-hidden">
          <div className="p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">{quiz.title}</h1>
            <p className="mt-4 text-lg text-gray-400">{quiz.description}</p>
            <div className="mt-8 space-y-4 text-gray-300">
                <div className="flex items-center gap-4"><HelpCircle size={20} className="text-gray-500"/><span>{questions.length} questions</span></div>
                {quiz.timeLimit && <div className="flex items-center gap-4"><Clock size={20} className="text-gray-500"/><span>{quiz.timeLimit} minute time limit</span></div>}
                <div className="flex items-center gap-4"><Check size={20} className="text-gray-500"/><span>Answers saved automatically</span></div>
            </div>
          </div>
          <div className="bg-gray-900/50 p-8 md:p-12 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Instructions</h3>
              <ul className="list-disc list-outside text-gray-400 space-y-2 pl-5">
                <li>Read each question carefully before answering.</li>
                <li>You can navigate between questions at any time.</li>
                <li>Your progress is shown in the sidebar.</li>
                <li>Click "Submit Quiz" only when you are finished.</li>
              </ul>
            </div>
            <button onClick={startQuiz} className="mt-8 w-full flex items-center justify-center gap-3 py-4 px-4 text-lg font-semibold rounded-lg text-black bg-white hover:bg-gray-200 transition-transform duration-200 hover:scale-105">
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Main Content: Question & Options */}
        <div className="lg:col-span-2 bg-gray-950 border border-gray-800 rounded-2xl p-6 md:p-8">
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-400 mb-2">Question {currentQuestionIndex + 1} of {questions.length}</p>
            <p className="text-xl font-semibold text-white">{currentQuestion.text}</p>
          </div>
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion._id] === option._id;
              return (
                <button
                  key={option._id}
                  onClick={() => handleAnswerSelect(currentQuestion._id, option._id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-4
                    ${isSelected ? 'bg-gray-800 border-gray-600' : 'bg-gray-900 border-gray-800 hover:border-gray-700'}`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-white bg-white' : 'border-gray-600'}`}>
                    {isSelected && <Check size={16} className="text-black" />}
                  </div>
                  <span className="text-gray-300">{option.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sticky Sidebar: Progress & Navigation */}
        <div className="lg:sticky top-24">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">{quiz.title}</h2>
            {timeLeft !== null && (
              <div className="flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-800 mb-4">
                <span className="text-sm font-medium text-gray-400">Time Left</span>
                <span className="text-lg font-semibold text-white">{formatTime(timeLeft)}</span>
              </div>
            )}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Progress</span>
                <span>{countAnsweredQuestions()}/{questions.length}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-white h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white mb-2">Questions</h3>
              <div className="grid grid-cols-7 gap-2">
                {questions.map((q, index) => {
                  const isAnswered = answers[q._id] !== null;
                  const isCurrent = currentQuestionIndex === index;
                  return (
                    <button
                      key={q._id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors
                        ${isCurrent ? 'bg-white text-black' : isAnswered ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button onClick={goToPreviousQuestion} disabled={currentQuestionIndex === 0} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                <ArrowLeft size={16}/> Prev
              </button>
              {currentQuestionIndex < questions.length - 1 ? (
                <button onClick={goToNextQuestion} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 bg-white text-black hover:bg-gray-200">
                  Next <ArrowRight size={16}/>
                </button>
              ) : (
                <button onClick={submitQuiz} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 bg-green-500 text-white hover:bg-green-600">
                  <Flag size={16}/> Submit Quiz
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
