// src/components/profile/AttemptDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const AttemptDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [attemptData, setAttemptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedExplanations, setExpandedExplanations] = useState({});
  
  useEffect(() => {
    const fetchAttemptDetail = async () => {
      setLoading(true);
      try {
        // Fixed: Using template literal to insert the actual ID parameter
        const response = await api.get(`/attempts/${id}`);
        console.log(response);
        
        // Fixed: Handle the response structure that matches the controller
        if (response.data.success) {
          setAttemptData({
            attempt: response.data.attempt,
            quiz: response.data.attempt.quiz
          });
        } else {
          throw new Error(response.data.message || 'Failed to load attempt details');
        }
        
        setError(null);
        
        // Initialize expanded state for all questions
        if (response.data.attempt?.quiz?.questions) {
          const initialExpandedState = {};
          response.data.attempt.quiz.questions.forEach(question => {
            initialExpandedState[question._id] = false;
          });
          setExpandedExplanations(initialExpandedState);
        }
      } catch (error) {
        console.error('Error fetching attempt details:', error);
        // Extract error message from the API response if available
        const errorMessage = error.response?.data?.message || 'Failed to load attempt details. Please try again later.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttemptDetail();
  }, [id]);
  
  const toggleExplanation = (questionId) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };
  
  const getScoreBadgeColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const handleRetakeQuiz = () => {
    if (attemptData?.quiz?._id) {
      navigate(`/quiz/${attemptData.quiz._id}`);
    }
  };
  
  const renderLoadingState = () => (
    <div className="text-center py-10">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
      <p className="text-gray-500">Loading attempt details...</p>
    </div>
  );
  
  const renderErrorState = () => (
    <div className="text-center py-10 max-w-md mx-auto">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
      <Link 
        to="/my-attempts" 
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to My Attempts
      </Link>
    </div>
  );
  
  const renderEmptyDataState = () => (
    <div className="text-center py-10 max-w-md mx-auto">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M12 14a2 2 0 100-4 2 2 0 000 4z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-yellow-800 mb-2">No Data</h3>
        <p className="text-yellow-700">Attempt data could not be loaded correctly.</p>
      </div>
      <Link 
        to="/my-attempts" 
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to My Attempts
      </Link>
    </div>
  );
  
  const renderQuestionsList = () => {
    const { attempt, quiz } = attemptData;
    
    return (
      <div className="space-y-6">
        {quiz.questions.map((question, index) => {
          const userAnswer = attempt.answers.find(a => a.questionId === question._id);
          const correctOption = question.options.find(o => o.correct);
          const userSelectedOption = userAnswer ? question.options[userAnswer.selectedOption] : null;
          const isExpanded = expandedExplanations[question._id];
          
          return (
            <div key={question._id} className="border border-gray-200 rounded-lg p-4 shadow-sm">
              <p className="font-semibold mb-2">
                {index + 1}. {question.text}
              </p>
              
              <div className="ml-0 sm:ml-4 space-y-1">
                {question.options.map((option, optIndex) => (
                  <div 
                    key={optIndex} 
                    className={`p-2 rounded ${
                      userAnswer && userAnswer.selectedOption === optIndex
                        ? userAnswer.isCorrect 
                          ? 'bg-green-100 border-green-500 border' 
                          : 'bg-red-100 border-red-500 border'
                        : option.correct 
                          ? 'bg-gray-100 border-gray-200 border' 
                          : 'border border-gray-100'
                    }`}
                  >
                    <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span> {option.text}
                    {option.correct && <span className="ml-2 text-green-600 text-sm">(Correct Answer)</span>}
                  </div>
                ))}
              </div>
              
              <div className="mt-2 text-sm">
                {userAnswer ? (
                  userAnswer.isCorrect ? (
                    <p className="text-green-600 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Correct! You selected the right answer.
                    </p>
                  ) : (
                    <p className="text-red-600 flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>
                        Incorrect. You selected {userSelectedOption ? userSelectedOption.text : 'no answer'}.
                        The correct answer is: {correctOption ? correctOption.text : 'N/A'}.
                      </span>
                    </p>
                  )
                ) : (
                  <p className="text-yellow-600 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    No answer provided.
                  </p>
                )}
              </div>
              
              {question.explanation && (
                <div className="mt-3">
                  <button
                    onClick={() => toggleExplanation(question._id)}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 mr-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {isExpanded ? 'Hide Explanation' : 'Show Explanation'}
                  </button>
                  
                  {isExpanded && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-md text-sm">
                      <p className="text-gray-800">{question.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  const renderPerformanceSummary = () => {
    const { attempt, quiz } = attemptData;
    const totalQuestions = quiz.questions.length;
    const correctAnswers = attempt.answers.filter(a => a.isCorrect).length;
    
    return (
      <div className="mb-6 bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">Performance Summary</h2>
        
        <div className="h-6 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-blue-500 text-xs font-medium text-white text-center p-0.5 leading-none rounded-full"
            style={{ width: `${attempt.score}%` }}
          >
            {attempt.score}%
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-gray-500 text-sm">Total Questions</p>
            <p className="font-bold text-xl">{totalQuestions}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-gray-500 text-sm">Correct</p>
            <p className="font-bold text-xl text-green-700">{correctAnswers}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-gray-500 text-sm">Incorrect</p>
            <p className="font-bold text-xl text-red-700">{totalQuestions - correctAnswers}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-gray-500 text-sm">Time Taken</p>
            <p className="font-bold text-xl">
              {attempt.timeTaken ? `${Math.floor(attempt.timeTaken / 60)}m ${attempt.timeTaken % 60}s` : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  if (loading) return renderLoadingState();
  if (error) return renderErrorState();
  if (!attemptData || !attemptData.attempt || !attemptData.quiz) return renderEmptyDataState();
  
  const { attempt, quiz } = attemptData;
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Attempt Details</h1>
          <p className="text-gray-600">Completed on {formatDate(attempt.completedAt || attempt.createdAt)}</p>
        </div>
        <Link 
          to="/my-attempts" 
          className="text-blue-500 hover:text-blue-700 inline-flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to All Attempts
        </Link>
      </div>
      
      {/* Quiz Info Card */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold">{quiz.title}</h2>
            {quiz.description && <p className="text-gray-600 mt-1">{quiz.description}</p>}
          </div>
          <div className="flex items-center">
            <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${getScoreBadgeColor(attempt.score)} mr-4`}>
              {attempt.score}%
            </span>
            <button 
              onClick={handleRetakeQuiz}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retake Quiz
            </button>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-600">
                {quiz.category || 'General Knowledge'}
              </span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-600">
                {quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No time limit'}
              </span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-gray-600">
                {quiz.questions.length} Questions
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance Summary */}
      {renderPerformanceSummary()}
      
      {/* Questions and Answers */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-xl font-bold mb-4">Questions and Answers</h2>
        {renderQuestionsList()}
      </div>
    </div>
  );
};

export default AttemptDetail;