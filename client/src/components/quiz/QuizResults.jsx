import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';

const QuizResults = () => {
  const { attemptId } = useParams();
  console.log('Attempt ID:', attemptId);
  
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  
  useEffect(() => {
    const fetchAttemptDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/quizzes/attempts/${attemptId}`);
        setAttempt(response.data.attempt);
        setQuiz(response.data.quiz);
        setError(null);
      } catch (error) {
        console.error('Error fetching attempt details:', error);
        setError('Failed to load quiz results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttemptDetails();
  }, [attemptId]);
  
  const toggleShowAnswers = () => {
    setShowAnswers(prev => !prev);
  };
  
  const getScoreBadgeColor = (score) => {
    const percentage = (score / attempt.maxScore) * 100;
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-blue-100 text-blue-800';
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-800';
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

  const calculatePercentage = () => {
    if (!attempt || !attempt.maxScore) return 0;
    return Math.round((attempt.score / attempt.maxScore) * 100);
  };

  // Helper function to find the selected option text
  const findSelectedOptionText = (questionId, question) => {
    if (!attempt || !attempt.answers) return 'No answer';
    
    const answer = attempt.answers.find(a => a.questionId === questionId);
    if (!answer || !answer.selectedOptionId) return 'No answer';
    
    const selectedOption = question.options.find(opt => opt._id === answer.selectedOptionId);
    return selectedOption ? selectedOption.text : 'No answer';
  };
  
  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
        <div className="mt-4">
          <Link to="/quizzes" className="text-blue-500 hover:underline">
            Back to Quizzes
          </Link>
        </div>
      </div>
    );
  }

  if (!attempt || !quiz) {
    return null;
  }

  const scorePercentage = calculatePercentage();
  const isPassed = scorePercentage >= (quiz.passScore || 0);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Quiz Results: {quiz.title}</h1>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <span className={`px-4 py-2 rounded-full text-lg font-medium ${getScoreBadgeColor(attempt.score)}`}>
            Score: {scorePercentage}% ({attempt.score}/{attempt.maxScore} points)
          </span>
          {quiz.passScore && (
            <span className={`px-4 py-2 rounded-full text-lg font-medium ${isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isPassed ? 'PASSED' : 'FAILED'}
            </span>
          )}
          <p className="text-gray-600">Completed on: {formatDate(attempt.completedAt)}</p>
        </div>
        
        <button
          onClick={toggleShowAnswers}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
        >
          {showAnswers ? 'Hide Answers' : 'Show Answers'}
        </button>
      </div>

      {showAnswers && (
        <div className="space-y-6">
          {quiz.questions.map((question, index) => {
            const answer = attempt.answers.find(a => a.questionId === question._id);
            const correctOptions = question.options.filter(opt => opt.correct === true);
            const selectedAnswerText = findSelectedOptionText(question._id, question);
            
            return (
              <div key={question._id} className="p-4 border rounded-lg bg-white shadow-sm">
                <h3 className="font-semibold text-lg mb-3">
                  {index + 1}. {question.text}
                </h3>
                
                <div className="space-y-2">
                  <p className="text-green-600 font-medium">
                    Correct Answer: {correctOptions.map(opt => opt.text).join(', ')}
                  </p>
                  <p className={answer?.isCorrect ? 'text-green-600' : 'text-red-600'}>
                    Your Answer: {selectedAnswerText}
                    {answer?.isCorrect ? ' ✓' : ' ✕'}
                  </p>
                  {answer && (
                    <p className="text-gray-600">
                      Points: {answer.pointsEarned || 0} / {1} {/* Assuming 1 point per question if not specified */}
                    </p>
                  )}
                </div>
                
                {!answer?.isCorrect && correctOptions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-gray-700">
                      <span className="font-medium">Explanation:</span> The correct answer is {correctOptions.map(opt => opt.text).join(', ')}.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex gap-4">
        <Link 
          to="/quizzes" 
          className="inline-block bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded transition-colors"
        >
          Back to Quizzes
        </Link>
        
        {scorePercentage < 80 && (
          <Link 
            to={`/quiz/take/${quiz._id}`}
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors"
          >
            Try Again
          </Link>
        )}
      </div>
    </div>
  );
};

export default QuizResults;