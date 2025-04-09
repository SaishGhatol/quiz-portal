import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';

const QuizResults = () => {
  const { attemptId } = useParams();
  
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  
  useEffect(() => {
    const fetchAttemptDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/attempts/${attemptId}`);
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

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Quiz Results: {quiz.title}</h1>
        <div className="flex items-center gap-4 mb-4">
          <span className={`px-4 py-2 rounded-full text-lg font-medium ${getScoreBadgeColor(attempt.score)}`}>
            Score: {attempt.score}%
          </span>
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
            const correctOption = question.options.find(opt => opt.correct);
            
            return (
              <div key={question._id} className="p-4 border rounded-lg bg-white shadow-sm">
                <h3 className="font-semibold text-lg mb-3">
                  {index + 1}. {question.questionText}
                </h3>
                
                <div className="space-y-2">
                  <p className="text-green-600 font-medium">
                    Correct Answer: {correctOption?.text}
                  </p>
                  <p className={answer?.isCorrect ? 'text-green-600' : 'text-red-600'}>
                    Your Answer: {question.options[answer?.selectedOption]?.text || 'No answer'}
                    {answer?.isCorrect ? ' ✓' : ' ✕'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <Link 
          to="/quizzes" 
          className="inline-block bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded transition-colors"
        >
          Back to Quizzes
        </Link>
      </div>
    </div>
  );
};

export default QuizResults;