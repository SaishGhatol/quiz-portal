import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';

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
  
  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/quizzes/${id}/questions`);
        setQuiz(response.data.quiz);
        setQuestions(response.data.questions);
        
        // Initialize answers object
        const initialAnswers = {};
        response.data.questions.forEach(q => {
          initialAnswers[q._id] = null;
        });
        setAnswers(initialAnswers);
        
        // Set timer if quiz has a time limit
        if (response.data.quiz.timeLimit) {
          setTimeLeft(response.data.quiz.timeLimit * 60); // convert minutes to seconds
        }
        
        setError(null);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        setError('Failed to load quiz. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);
  
  useEffect(() => {
    // Timer logic
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
  };
  
  const handleAnswerSelect = (questionId, answerId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
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
  
  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };
  
  const isQuestionAnswered = (questionId) => {
    return answers[questionId] !== null;
  };
  
  const countAnsweredQuestions = () => {
    return Object.values(answers).filter(answer => answer !== null).length;
  };
  
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  const submitQuiz = async () => {
    try {
      // Convert answers object to array of {questionId, selectedOptionId} objects
      const formattedAnswers = Object.entries(answers).map(([questionId, answerId]) => ({
        questionId,
        selectedOptionId: answerId
      }));
      
      const response = await api.post(`/quizzes/${id}/submit`, {
        answers: formattedAnswers
      });
      
      navigate(`/quiz/results/${response.data.attemptId}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Loading quiz...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }
  
  if (!quiz || !questions.length) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Quiz not found or has no questions.</p>
      </div>
    );
  }
  
  if (!quizStarted) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-4">{quiz.title}</h1>
          <p className="text-gray-700 mb-6">{quiz.description}</p>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Quiz Instructions
                </h3>
                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                  <li>The quiz contains {questions.length} questions.</li>
                  {quiz.timeLimit && (
                    <li>You have {quiz.timeLimit} minutes to complete the quiz.</li>
                  )}
                  <li>You can navigate between questions using the navigation buttons.</li>
                  <li>Your answers are saved automatically when you select them.</li>
                  <li>You can review and change your answers before final submission.</li>
                  <li>Click "Submit Quiz" when you are ready to submit your answers.</li>
                </ul>
              </div>
            </div>
          </div>
          
          <button
            onClick={startQuiz}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md font-medium"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Quiz header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          {timeLeft !== null && (
            <div className="text-lg font-medium">
              Time Left: <span className={timeLeft < 60 ? 'text-red-600' : ''}>{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{countAnsweredQuestions()} of {questions.length} answered</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${(countAnsweredQuestions() / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Question display */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Question {currentQuestionIndex + 1} of {questions.length}</h2>
          </div>
          
          <p className="text-lg mb-4">{currentQuestion.text}</p>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <div key={option._id} className="flex items-center">
                <input
                  type="radio"
                  id={option._id}
                  name={`question-${currentQuestion._id}`}
                  className="w-4 h-4 text-blue-600"
                  checked={answers[currentQuestion._id] === option._id}
                  onChange={() => handleAnswerSelect(currentQuestion._id, option._id)}
                />
                <label htmlFor={option._id} className="ml-2 text-gray-700">
                  {option.text}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className={`px-4 py-2 rounded-md ${
              currentQuestionIndex === 0 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>
          
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={goToNextQuestion}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Next
            </button>
          ) : (
            <button
              onClick={submitQuiz}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
            >
              Submit Quiz
            </button>
          )}
        </div>
        
        {/* Question navigation */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Question Navigation</h3>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, index) => (
              <button
                key={q._id}
                onClick={() => goToQuestion(index)}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                  currentQuestionIndex === index 
                    ? 'bg-blue-500 text-white' 
                    : isQuestionAnswered(q._id)
                      ? 'bg-green-100 text-green-800 border border-green-500' 
                      : 'bg-gray-200 text-gray-700'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeQuiz;