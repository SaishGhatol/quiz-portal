import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { Loader } from "lucide-react";

const QuizResults = () => {
  const {attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [timeRequired, setTimeRequired] = useState(null);

  useEffect(() => {
    const fetchAttemptDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/quizzes/attempts/${attemptId}`);
        // Set attempt data
        setAttempt(response.data.attempt);
        // Set quiz data
        setQuiz(response.data.quiz);
        // Set questions data
        if (response.data.quiz && response.data.quiz.questions) {
          setQuestions(response.data.quiz.questions);
        }
        // Calculate time required to complete the quiz
        if (response.data.attempt) {
          calculateTimeTaken(response.data.attempt);
        }
        setError(null);
      } catch (error) {
        setError('Failed to load quiz results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttemptDetails();
  }, [attemptId]);

  // Improved time calculation logic to handle missing completedAt
  const calculateTimeTaken = (attemptData, timeLimit = null) => {
    if (!attemptData) {
      setTimeRequired(null);
      return;
    }
  
    const { startedAt, completedAt, timedOut } = attemptData;
  
    // If we don't have a valid startedAt, we can't calculate time
    if (!startedAt || typeof startedAt !== 'string') {
      console.warn('Missing or invalid startedAt value:', {
        hasStartedAt: !!startedAt,
        startedAtValue: startedAt
      });
      setTimeRequired(null);
      return;
    }
  
    try {
      const startTime = new Date(startedAt);
  
      // Validate start time
      if (isNaN(startTime.getTime())) {
        throw new Error('Invalid date value: startedAt cannot be parsed');
      }
  
      // Determine end time based on various conditions
      let endTime;
      
      // Case 1: If the attempt timed out and we have a time limit, use that exact time
      if (timedOut && timeLimit) {
        // Calculate the exact end time based on the time limit
        endTime = new Date(startTime.getTime() + timeLimit);
      }
      // Case 2: If we have a completedAt timestamp, use that
      else if (completedAt) {
        endTime = new Date(completedAt);
        
        // Validate the endTime
        if (isNaN(endTime.getTime())) {
          throw new Error('Invalid date value: completedAt cannot be parsed');
        }
      }
      // Case 3: Otherwise, use current time
      else {
        endTime = new Date();
      }
  
      // Calculate time difference in milliseconds
      const timeDiffMs = endTime - startTime;
  
      // Ensure we always have a non-negative time
      // Instead of using absolute value (which can hide errors),
      // log a warning if we get an unexpected negative time
      if (timeDiffMs < 0) {
        console.warn('Negative time calculation detected:', {
          startTime,
          endTime,
          timeDiffMs
        });
        // Only in extreme edge cases, use a fallback value or zero
        // depending on your application needs
        setTimeRequired(0);
      } else {
        setTimeRequired(timeDiffMs);
      }
      
      // Optionally return the calculated value for testing or additional processing
      return timeDiffMs;
    } catch (error) {
      console.error('Error calculating time taken:', error);
      setTimeRequired(null);
      return null;
    }
  };

  const toggleShowAnswers = () => {
    setShowAnswers(prev => !prev);
  };

  const getScoreBadgeColor = (score) => {
    if (!attempt || !attempt.maxScore) return 'bg-gray-100 text-gray-800';
    const percentage = (score / attempt.maxScore) * 100;
    if (percentage >= 80) return 'bg-green-600 text-white';
    if (percentage >= 60) return 'bg-blue-600 text-white';
    if (percentage >= 40) return 'bg-yellow-600 text-white';
    return 'bg-red-600 text-white';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'In progress';

    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    try {
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      return 'Invalid date';
    }
  };

  const calculatePercentage = () => {
    if (!attempt || !attempt.maxScore || attempt.maxScore === 0) return 0;
    return Math.round((attempt.score / attempt.maxScore) * 100);
  };

  // Improved time formatting function
  const formatTimeDisplay = (timeInMs) => {
    if (timeInMs === null || timeInMs === undefined || isNaN(timeInMs)) {
      return 'N/A';
    }

    // Convert to seconds
    const seconds = Math.floor(timeInMs / 1000);

    // Handle hours, minutes, seconds for better human readability
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [];

    // Only include hours if there are any
    if (hours > 0) {
      parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    }

    // Only include minutes if there are any or if we're showing hours
    if (minutes > 0 || hours > 0) {
      parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    }

    // Always include seconds unless we have hours and no seconds
    if (remainingSeconds > 0 || parts.length === 0 || (hours === 0)) {
      parts.push(`${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`);
    }

    return parts.join(' ');
  };

  // Updated findSelectedOptionText function
  const findSelectedOptionText = (questionId, questionOptions) => {
    if (!attempt || !attempt.answers) return 'No answer';

    const answer = attempt.answers.find(a => a.questionId === questionId);
    if (!answer) return 'No answer';

    // It means the answer was provided but we don't have the text
    if (!answer.selectedAnswer && answer.isCorrect) {
      return 'Correct answer';
    }

    if (!answer.selectedAnswer) return 'No answer';

    if (!Array.isArray(questionOptions) || questionOptions.length === 0) {
      return `(${answer.selectedAnswer})`;
    }

    const selectedOption = questionOptions.find(opt => opt._id === answer.selectedAnswer);
    return selectedOption ? selectedOption.text : `${answer.selectedAnswer}`;
  };

  // Handle JSX attributes properly
  const getPath = (showState) => {
    return showState ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7";
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-red-500 mb-4 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-center mb-4">Error Loading Results</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <div className="flex justify-center">
            <Link to="/quizzes" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
              Back to Quizzes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-yellow-500 mb-4 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-center mb-4">No Data Found</h2>
          <p className="text-gray-600 text-center mb-6">We couldn't find any quiz attempt data. The quiz might have been deleted or is unavailable.</p>
          <div className="flex justify-center">
            <Link to="/quizzes" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
              Back to Quizzes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Ensure we have an answers array
  const answers = attempt.answers || [];

  const scorePercentage = calculatePercentage();
  const isPassed = scorePercentage >= (quiz?.passScore || 0);
  const quizTitle = quiz?.title || 'Quiz Results';

  // Check if we need to display the "No questions available" message
  const noQuestionsAvailable = !questions || questions.length === 0;

  // Check if quiz is still in progress (no completedAt)
  const isInProgress = !attempt.completedAt;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {isInProgress && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>This quiz is still in progress. Time calculations are based on current time.</span>
            </div>
          )}

          <h1 className="text-3xl font-bold mb-4 text-gray-800 border-b pb-4">{quizTitle}</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="mr-3 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-600">Status: {attempt.completedAt ? 'Completed' : 'In Progress'}</p>
              </div>

              <div className="flex items-center">
                <div className="mr-3 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-600">{attempt.completedAt ? 'Completed on:' : 'Started on:'} {formatDate(attempt.completedAt || attempt.startedAt)}</p>
              </div>

              <div className="flex items-center">
                <div className="mr-3 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600">Total questions: {answers.length || 0}</p>
              </div>

              {quiz?.timeLimit && (
                <div className="flex items-center">
                  <div className="mr-3 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Time limit: {quiz.timeLimit} minutes</p>
                </div>
              )}

              <div className="flex items-center">
                <div className="mr-3 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-600">Time taken: {formatTimeDisplay(timeRequired)} {!attempt.completedAt && ' (so far)'}</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4">
              <div className="text-center mb-2">
                <span className={`inline-block px-6 py-3 rounded-full text-xl font-bold ${getScoreBadgeColor(attempt.score)}`}>
                  {scorePercentage}%
                </span>
              </div>
              <p className="text-lg font-medium mb-2">Score: {attempt.score}/{attempt.maxScore} points</p>

              {quiz?.passScore !== undefined && (
                <div className="mt-2">
                  <span className={`inline-block px-4 py-2 rounded-md text-white font-medium ${isPassed ? 'bg-green-600' : 'bg-red-600'}`}>
                    {isPassed ? 'PASSED' : 'FAILED'}
                    {isPassed ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">Passing score: {quiz.passScore}%</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <button
              onClick={toggleShowAnswers}
              className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              {showAnswers ? 'Hide Answers' : 'Show Answers'}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={getPath(showAnswers)} />
              </svg>
            </button>
          </div>
        </div>

        {showAnswers && (
          <div className="space-y-6">
            {noQuestionsAvailable ? (
              answers.length > 0 ? (
                answers.map((answer, index) => {
                  const isCorrect = answer?.isCorrect === true;

                  return (
                    <div key={answer.questionId || index} className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                      <div className="p-5">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-start">
                          <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-800 mr-3">
                            {index + 1}
                          </span>
                          <span>Question {index + 1}</span>
                        </h3>

                        <div className="ml-11 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <span className={isCorrect ? 'text-green-800' : 'text-red-800'}>
                                  Option ID: {answer.selectedOptionId}
                                </span>
                              </div>
                            </div>

                            <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
                              <p className="text-gray-700 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="font-medium">Points earned:</span>
                                <span className="ml-2 font-bold text-blue-700">
                                  {answer.pointsEarned || 0} / {answer.maxPoints || 1}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-yellow-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="text-lg font-medium text-yellow-800 mb-2">No Answer Details Available</h3>
                  <p className="text-yellow-700">We couldn't load the question details for this quiz. However, your final score is still available.</p>
                </div>
              )
            ) : (
              questions.map((question, index) => {
                // Ensure question is valid
                if (!question) return null;

                // Check if attempt.answers exists before using it
                const answer = answers.find(a => a.questionId === question._id);

                // Handle case where question.options might be undefined
                const options = Array.isArray(question.options) ? question.options : [];
                const correctOptions = options.filter(opt => opt.isCorrect === true);

                const selectedAnswerText = findSelectedOptionText(question._id, options);
                const isCorrect = answer?.isCorrect === true;            

                return (
                  <div key={question._id || index} className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                    <div className="p-5">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-start">
                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-800 mr-3">
                          {index + 1}
                        </span>
                        <span>{question.text}</span>
                      </h3>

                      <div className="ml-11 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <span className={isCorrect ? 'text-green-800' : 'text-red-800'}>
                                {selectedAnswerText}
                              </span>
                            </div>
                          </div>

                          <div className="p-3 rounded-md bg-green-50 border border-green-200">
                            <p className="text-gray-700 font-medium">Correct Answer:</p>
                            <p className="text-green-800 mt-2">
                              {correctOptions.length > 0
                                ? correctOptions.map(opt => opt.text).join(', ')
                                : 'No correct option defined'}
                            </p>
                          </div>
                        </div>

                        {answer && (
                          <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                            <p className="text-gray-700 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span className="font-medium">Points earned:</span>
                              <span className="ml-2 font-bold text-blue-700">
                                {answer.pointsEarned || 0} / {question.points || 1}
                              </span>
                            </p>
                          </div>
                        )}

                        {/* Fixed explanation rendering: */}
                        {!isCorrect && (
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
              })
            )}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link
            to="/quizzes"
            className="flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Quizzes
          </Link>

          {quiz?._id && scorePercentage < 80 && (
            <Link
              to={`/quiz/${quiz._id}`}
              className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </Link>
          )}

        </div>
      </div>
    </div>
  );
};

export default QuizResults;