import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Loader } from 'lucide-react';

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
        const response = await api.get(`/attempts/${id}`);
        
        if (response.data.success) {
          setAttemptData({
            attempt: response.data.attempt,
            quiz: response.data.attempt.quiz
          });
        } else {
          throw new Error(response.data.message || 'Failed to load attempt details');
        }
        
        setError(null);
        
        if (response.data.attempt?.quiz?.questions) {
          const initialExpandedState = {};
          response.data.attempt.quiz.questions.forEach(question => {
            initialExpandedState[question.id] = false;
          });
          setExpandedExplanations(initialExpandedState);
        }
      } catch (error) {
      
        const errorMessage = error.response?.data?.message || 'Failed to load attempt details. Please try again later.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttemptDetail();
  }, [id]);

  useEffect(() => {
    if (attemptData?.attempt) {
      // Check if timeTaken exists and handle different possible formats
      if (attemptData.attempt.timeTaken !== undefined) {
        // Already in seconds format, no change needed
      } else if (attemptData.attempt.startedAt && attemptData.attempt.completedAt) {
        // Calculate time taken from timestamps
        const startTime = new Date(attemptData.attempt.startedAt);
        const endTime = new Date(attemptData.attempt.completedAt);
        
        // If dates are valid, calculate the time difference in seconds
        if (!isNaN(startTime) && !isNaN(endTime)) {
          const timeDiffInSeconds = Math.round((endTime - startTime) / 1000);
          // Update the attempt data with the calculated time
          setAttemptData(prev => ({
            ...prev,
            attempt: {
              ...prev.attempt,
              timeTaken: timeDiffInSeconds > 0 ? timeDiffInSeconds : 0
            }
          }));
        }
      }
    }
  }, [attemptData?.attempt]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-white rounded-lg shadow-md">
        <div className="text-center p-10">
          <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your Attempt Details...</p>
        </div>
      </div>
    );
  }
  const formatTime = (seconds) => {
    if (seconds === undefined || seconds === null) return 'N/A';
    
    // Ensure seconds is a number
    seconds = Number(seconds);
    if (isNaN(seconds)) return 'N/A';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  
  const toggleExplanation = (questionId) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };
  
  const getScoreBadgeColor = (score) => {
    if (score >= 90) return 'bg-emerald-100 text-emerald-800';
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-blue-100 text-blue-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 50) return 'bg-orange-100 text-orange-800';
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
  
  const formatScore = (score, maxScore) => {
    if (score === null || score === undefined) return 'N/A';
    if (maxScore) return `${Math.round((score / maxScore) * 100)}%`;
    return `${maxScore} pts`;
  };

  const handleRetakeQuiz = () => {
    if (attemptData?.quiz?._id) {
      navigate(`/quiz/${attemptData.quiz._id}`);
    }
  };

  const calculateWeakAreas = () => {
    if (!attemptData?.attempt?.answers || !attemptData?.quiz?.questions) return [];
    
    const categoryCounts = {};
    const categoryIncorrect = {};
    
    attemptData.quiz.questions.forEach((question, index) => {
      const userAnswer = attemptData.attempt.answers.find(a => a.questionId === question._id);
      const category = question.category || 'Uncategorized';
      
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      
      if (!userAnswer || !userAnswer.isCorrect) {
        categoryIncorrect[category] = (categoryIncorrect[category] || 0) + 1;
      }
    });
    
    const weakAreas = Object.keys(categoryCounts)
      .map(category => ({
        name: category,
        total: categoryCounts[category],
        incorrect: categoryIncorrect[category] || 0,
        percentage: categoryCounts[category] > 0 
          ? Math.round(((categoryIncorrect[category] || 0) / categoryCounts[category]) * 100) 
          : 0
      }))
      .filter(area => area.percentage > 30)
      .sort((a, b) => b.percentage - a.percentage);
    
    return weakAreas.slice(0, 3); // Return top 3 weak areas
  };
  
  
  const renderErrorState = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="text-center p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
        <div className="bg-red-50 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Something Went Wrong</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
            onClick={() => navigate('/admin')}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors cursor-pointer"
          >
            <span className="mr-2">←</span>
            Back to Dashboard
          </button>
      </div>
    </div>
  );
  
  const renderEmptyDataState = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="text-center p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
        <div className="bg-yellow-50 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M12 14a2 2 0 100-4 2 2 0 000 4z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Quiz Data</h3>
        <p className="text-gray-600 mb-6">The attempt data could not be found or is no longer available.</p>
        <Link 
          to="/my-attempts" 
          className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition duration-150"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to My Attempts
        </Link>
      </div>
    </div>
  );


  const renderQuestionsList = () => {
    const { attempt, quiz } = attemptData;
    
    return (
      <div className="space-y-6">
        {quiz.questions.map((question, index) => {
          const userAnswer = attempt.answers.find(a => a.questionId === question._id);
          const options = Array.isArray(question.options) ? question.options : [];
          // Fix: Check both opt.correct and opt.isCorrect properties to handle both data structures
          const correctOptions = options.filter(opt => opt.correct === true || opt.isCorrect === true);
          // Additional check for original code structure where we might have a single correct option
          const correctOption = question.options ? question.options.find(o => o.correct) : null;
          
          // Improved logic for finding selected option text
          let selectedOptionText = null;
          if (userAnswer) {
            if (userAnswer.selectedOption !== undefined && userAnswer.selectedOption !== null && 
                question.options && question.options[userAnswer.selectedOption]) {
              selectedOptionText = question.options[userAnswer.selectedOption].text;
            } else if (userAnswer.selectedOptionId) {
              // Try to find by option ID if available
              const foundOption = question.options.find(opt => opt._id === userAnswer.selectedOptionId);
              if (foundOption) {
                selectedOptionText = foundOption.text;
              }
            } else if (userAnswer.selectedAnswer) {
              // Try to find by selectedAnswer if available
              const foundOption = question.options.find(opt => opt._id === userAnswer.selectedAnswer);
              if (foundOption) {
                selectedOptionText = foundOption.text;
              } else {
                selectedOptionText = userAnswer.selectedAnswer; // Fall back to raw value
              }
            }
          }
          
          const isExpanded = expandedExplanations[question._id];
          const isCorrect = userAnswer?.isCorrect === true;
          // Check if question was actually answered
          const isAnswered = userAnswer && (
            userAnswer.selectedOption !== undefined || 
            userAnswer.selectedOptionId || 
            userAnswer.selectedAnswer
          );
          
          return (
            <div 
              key={question._id} 
              className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${
                isCorrect ? 'border-green-500' : isAnswered ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <div className="p-5">
                {/* Question header with number and text */}
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-800 mr-3">
                    {index + 1}
                  </span>
                  <span>{question.text}</span>
                </h3>
                
                {/* Answer details */}
                <div className="ml-11 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* User answer section */}
                    {userAnswer ? (
                      <div className={`p-3 rounded-md ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <p className="text-gray-700 font-medium">Your Answer:</p>
                        <div className="flex items-center mt-2">
                          <span className={`mr-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {isCorrect ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </span>
                          {selectedOptionText ? (
                            <span className={isCorrect ? 'text-green-800' : 'text-red-800'}>
                              {selectedOptionText}
                            </span>
                          ) : (
                            <span className="text-gray-600 italic">No option selected</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200">
                        <p className="text-gray-700 font-medium flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Question not answered
                        </p>
                      </div>
                    )}
                    
                    {/* Correct answer section */}
                    <div className="p-3 rounded-md bg-green-50 border border-green-200">
                      <p className="text-gray-700 font-medium">Correct Answer:</p>
                      {correctOptions.length > 0 ? (
                        <p className="text-green-800 mt-2">
                          {correctOptions.map(opt => opt.text).join(', ')}
                        </p>
                      ) : correctOption ? (
                        <p className="text-green-800 mt-2">
                          {correctOption.text}
                        </p>
                      ) : (
                        <p className="text-gray-600 mt-2 italic">
                          No correct option defined
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Points earned section */}
                  {userAnswer && (
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                      <p className="text-gray-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="font-medium">Points earned:</span>
                        <span className="ml-2 font-bold text-blue-700">
                          {userAnswer.pointsEarned || (userAnswer.isCorrect ? 1 : 0)} / {question.points || 1}
                        </span>
                      </p>
                    </div>
                  )}
                
                  {/* Explanation section */}
                  {question.explanation && (
                    <div>
                      <button
                        onClick={() => toggleExplanation(question._id)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            Hide Explanation
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            Show Explanation
                          </>
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mt-3">
                          <p className="text-gray-700">
                            <span className="font-medium flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Explanation:
                            </span>
                            <span className="block mt-1 text-gray-600">
                              {question.explanation}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Auto show explanation if incorrect */}
                  {!isCorrect && userAnswer && !question.explanation && (
                    <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                      <p className="text-gray-700">
                        <span className="font-medium flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Explanation:
                        </span>
                        <span className="block mt-1 text-gray-600">
                          {correctOptions.length > 0
                            ? `The correct answer is: ${correctOptions.map(opt => opt.text).join(', ')}`
                            : correctOption 
                              ? `The correct answer is: ${correctOption.text}`
                              : 'No explanation available for this question.'
                          }
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
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
    const incorrectAnswers = totalQuestions - correctAnswers;
    const unansweredQuestions = totalQuestions - attempt.answers.length;
    
    // Score interpretation
    let scoreComment;
    let  score= parseFloat(formatScore(attempt.score, attempt.maxScore))
    if (score >= 90) scoreComment = "Excellent! You've mastered this quiz.";
    else if (score >= 80) scoreComment = "Great job! You're close to mastering this material.";
    else if (score >= 70) scoreComment = "Good work! You understand most of the material.";
    else if (score >= 60) scoreComment = "Decent attempt! Keep studying to improve.";
    else if (score >= 50) scoreComment = "You're on the right track. More practice needed.";
    else scoreComment = "Keep studying! You'll improve with more practice.";
    
    // Time efficiency (if time data is available)
    let timeComment;
if (attempt.timeTaken !== undefined && quiz.timeLimit) {
  const percentageUsed = (attempt.timeTaken / (quiz.timeLimit * 60)) * 100;
  
  if (percentageUsed < 50) {
    timeComment = `You finished quickly in ${formatTime(attempt.timeTaken)} (${Math.round(percentageUsed)}% of allowed time)`;
  } else if (percentageUsed < 85) {
    timeComment = `You used your time well: ${formatTime(attempt.timeTaken)} (${Math.round(percentageUsed)}% of allowed time)`;
  } else {
    timeComment = `You used most of your time: ${formatTime(attempt.timeTaken)} (${Math.round(percentageUsed)}% of allowed time)`;
  }
}
    // Calculate weak areas
    const weakAreas = calculateWeakAreas();
    
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Performance Summary</h2>
          
          {/* Score card */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-medium mb-1">Your Score</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold"> {formatScore(attempt.score, attempt.maxScore)}</span>
                  <span className="ml-2 text-blue-100">({correctAnswers} out of {totalQuestions})</span>
                </div>
                <p className="mt-2 text-blue-100">{scoreComment}</p>
              </div>
              
            </div>
          </div>
          
          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-green-700">Correct Answers</p>
                  <p className="text-2xl font-bold text-green-800">{correctAnswers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <div className="flex items-center">
                <div className="bg-red-100 p-2 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-red-700">Incorrect Answers</p>
                  <p className="text-2xl font-bold text-red-800">{incorrectAnswers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Time Taken</p>
                  <p className="text-2xl font-bold text-blue-800">
  {formatTime(attempt.timeTaken)}
</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Time comment */}
          {timeComment && (
            <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-blue-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {timeComment}
              </p>
            </div>
          )}
          
        </div>
      </div>
    );
  };
  
  
  if (error) return renderErrorState();
  if (!attemptData || !attemptData.attempt || !attemptData.quiz) return renderEmptyDataState();
  
  const { attempt, quiz } = attemptData;
  
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header bar */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attempt Details</h1>
              <p className="text-gray-600">Completed on {formatDate(attempt.completedAt || attempt.createdAt)}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getScoreBadgeColor(attempt.score)}`}>
                  {formatScore(attempt.score, attempt.maxScore)} Score
              </span>
              
              <button
            onClick={() => navigate('/admin')}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors cursor-pointer"
          >
            <span className="mr-2">←</span>
            Back to my Attempts
          </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quiz Info Card */}
        <div className="bg-white rounded-xl shadow-md mb-8 overflow-hidden">
          <div className="md:flex">
            <div className="md:flex-1 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h2>
              {quiz.description && (
                <p className="text-gray-600 mb-4">{quiz.description}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {quiz.category || 'General Knowledge'}
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(quiz.createdAt || Date.now()).split(',')[0]}
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No time limit'}
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {quiz.questions.length} Questions
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 md:w-64 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-gray-100">
              <button 
                onClick={handleRetakeQuiz}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center mb-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retake Quiz
              </button>
              
              <Link
                to={`/`}
                className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Browse More Quizzes
              </Link>
            </div>
          </div>
        </div>
        
        {/* Performance Summary */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Review</h2>
          {renderPerformanceSummary()}
        </div>
        
        {/* Questions and Answers */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Questions & Answers</h2>
            <div className="text-sm text-gray-500">
              {attempt.answers.filter(a => a.isCorrect).length} correct out of {quiz.questions.length} questions
            </div>
          </div>
          {renderQuestionsList()}
        </div>      
      </div>
    </div>
  );
};

export default AttemptDetail;