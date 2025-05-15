import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import {Loader} from "lucide-react"

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
  const [startTime, setStartTime] = useState(null); // Add startTime state

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
          setTimeLeft(response.data.quiz.timeLimit * 60);
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
    setStartTime(new Date()); // Record the start time when quiz is started
  };

  const handleAnswerSelect = (questionId, optionId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
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
      // Only include questions that have been answered
      const formattedAnswers = Object.entries(answers)
        .filter(([_, optionId]) => optionId !== null)
        .map(([questionId, optionId]) => ({
          questionId,
          selectedOptionId: optionId
        }));
  
      console.log('Submitting answers:', formattedAnswers);
      
      // Add debug logging for time values
      console.log('Quiz timing data:', { 
        startTime: startTime,
        startTimeISO: startTime ? startTime.toISOString() : 'null',
        quizStarted: quizStarted
      });
      
      // Fix: Always initialize startTime if it's not set yet but quiz is being submitted
      if (!startTime && quizStarted) {
        console.log('Start time was missing but quiz was started - setting default start time');
        setStartTime(new Date(Date.now() - 1000 * 60)); // Assume quiz started 1 minute ago
      }
      
      // Calculate quiz duration in minutes
      const endTime = new Date();
      const quizDuration = startTime ? Math.round((endTime - startTime) / (1000 * 60)) : null;
  
      // Debug the payload before sending
      const payload = {
        answers: formattedAnswers,
        startedAt: startTime ? startTime.toISOString() : new Date(Date.now() - 1000 * 60).toISOString(), // Fallback if somehow missing
        completedAt: endTime.toISOString() // Send end time to server
      };
      
      console.log('Submitting quiz with payload:', payload);
  
      const response = await api.post(`/quizzes/${id}/submit`, payload);
  
      toast.success('Quiz submitted successfully!');
      navigate(`/quiz/results/${response.data.attemptId}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      // Show more detailed error if available
      const errorMessage = error.response?.data?.message || 'Failed to submit quiz. Please try again.';
      toast.error(errorMessage);
    }
  };

  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-white rounded-lg shadow-md">
        <div className="text-center p-10">
          <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-red-100 mb-4">
            <svg className="w-6 h-6 md:w-8 md:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Error Loading Quiz</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition duration-200 shadow-md hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!quiz || !questions.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-yellow-100 mb-4">
            <svg className="w-6 h-6 md:w-8 md:h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Quiz Not Available</h2>
          <p className="text-gray-600 mb-6">Quiz not found or has no questions.</p>
          <button 
            onClick={() => navigate('/quizzes')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition duration-200 shadow-md hover:shadow-lg"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-blue-600 p-4 md:p-6">
              <h1 className="text-2xl md:text-3xl font-bold text-white text-center md:text-left">{quiz.title}</h1>
            </div>
            <div className="p-4 md:p-8">
              <p className="text-gray-700 mb-6 md:mb-8 text-base md:text-lg">{quiz.description}</p>

              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 md:p-6 mb-6 md:mb-10">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-shrink-0 mb-3 md:mb-0">
                    <svg className="h-6 w-6 text-blue-500 mx-auto md:mx-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div className="md:ml-4">
                    <h3 className="text-lg md:text-xl font-semibold text-blue-800 mb-3 text-center md:text-left">
                      Quiz Instructions
                    </h3>
                    <ul className="text-blue-800 space-y-2 text-sm md:text-base">
                      <li className="flex items-start">
                        <svg className="h-5 w-5 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>The quiz contains {questions.length} questions</span>
                      </li>
                      {quiz.timeLimit && (
                        <li className="flex items-start">
                          <svg className="h-5 w-5 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <span>You have {quiz.timeLimit} minutes to complete the quiz</span>
                        </li>
                      )}
                      <li className="flex items-start">
                        <svg className="h-5 w-5 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18"></path>
                        </svg>
                        <span>You can navigate between questions using the navigation buttons</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>Your answers are saved automatically when you select them</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        <span>You can review and change your answers before final submission</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Click "Submit Quiz" when you are ready to submit your answers</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={startQuiz}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 md:px-8 md:py-4 rounded-lg font-medium text-base md:text-lg transition duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Start Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = (countAnsweredQuestions() / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
    <div className="max-w-3xl mx-auto">
      {/* Quiz header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="bg-blue-500 p-4">
          <h1 className="text-xl font-bold text-white text-center">{quiz.title}</h1>
        </div>
        
        {/* Timer (if needed) */}
        {timeLeft !== null && (
          <div className="bg-gray-100 p-3 flex justify-center">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="text-lg font-medium text-gray-700">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        )}
      </div>
  
      {/* Main quiz content */}
      <div className="bg-white rounded-lg shadow-md p-5 mb-6">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Your Progress</span>
            <span>{countAnsweredQuestions()} of {questions.length} answered</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                progressPercentage < 30 ? 'bg-red-400' : 
                progressPercentage < 70 ? 'bg-yellow-400' : 'bg-green-400'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Question */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Question {currentQuestionIndex + 1} of {questions.length}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isQuestionAnswered(currentQuestion._id) ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {isQuestionAnswered(currentQuestion._id) ? 'Answered' : 'Not Answered'}
            </span>
          </div>
          <p className="text-gray-700 mb-6">{currentQuestion.text}</p>
          
          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const optionId = option._id || `option-${option.text}`;
              const isSelected = answers[currentQuestion._id] === optionId;
              
              return (
                <div 
                  key={optionId} 
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                  onClick={() => handleAnswerSelect(currentQuestion._id, optionId)}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-gray-400'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                    )}
                  </div>
                  <label 
                    htmlFor={`option-${currentQuestion._id}-${optionId}`} 
                    className="ml-3 text-gray-700 cursor-pointer flex-1"
                  >
                    {option.text}
                  </label>
                  <input
                    type="radio"
                    id={`option-${currentQuestion._id}-${optionId}`}
                    name={`question-${currentQuestion._id}`}
                    className="hidden"
                    checked={isSelected}
                    onChange={() => handleAnswerSelect(currentQuestion._id, optionId)}
                  />
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Question navigation */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Questions</h3>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, index) => {
              let bgColor = "bg-gray-100 text-gray-600";
              
              if (currentQuestionIndex === index) {
                bgColor = "bg-blue-500 text-white";
              } else if (isQuestionAnswered(q._id)) {
                bgColor = "bg-green-400 text-white";
              }
              
              return (
                <button
                  key={q._id || `question-${index}`}
                  onClick={() => goToQuestion(index)}
                  className={`w-8 h-8 flex items-center justify-center rounded ${bgColor}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className={`px-4 py-2 rounded text-sm font-medium ${
              currentQuestionIndex === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>
  
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={goToNextQuestion}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium"
            >
              Next
            </button>
          ) : (
            <button
              onClick={submitQuiz}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium"
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>
      
      {/* Instructions or helpful info */}
      <div className="text-center text-sm text-gray-500">
        <p>Answer all questions before submitting your quiz.</p>
      </div>
    </div>
  </div>
  );
};

export default TakeQuiz;