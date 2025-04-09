import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const QuizResults = () => {
  const { id: quizId, attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttemptDetails = async () => {
      try {
        const attemptResponse = await api.get(`/quizzes/attempts/${attemptId}`);
        setAttempt(attemptResponse.data.attempt);
        
        const quizResponse = await api.get(`/quizzes/${quizId}`);
        setQuiz(quizResponse.data.quiz);
      } catch (err) {
        setError('Failed to load results. Please try again later.');
        console.error('Error fetching quiz results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttemptDetails();
  }, [quizId, attemptId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  const scorePercentage = (attempt.score / attempt.maxScore) * 100;
  const passed = scorePercentage >= quiz.passScore;
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Quiz Results</h1>
        
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">{quiz.title}</h2>
            <p className="text-gray-600">{quiz.description}</p>
          </div>
          
          <div className="text-right mt-4 md:mt-0">
            <p className="text-sm text-gray-500">
              Attempted on: {formatDate(attempt.createdAt)}
            </p>
            <p className="text-sm text-gray-500">
              Completed in: {
                Math.round((new Date(attempt.completedAt) - new Date(attempt.startedAt)) / 60000)
              } minutes
            </p>
          </div>
        </div>
        
        {/* Score summary */}
        <div className={`p-6 rounded-lg mb-6 ${
          passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h3 className={`text-xl font-bold ${passed ? 'text-green-700' : 'text-red-700'}`}>
                {passed ? 'Congratulations! You passed!' : 'You did not pass this time.'}
              </h3>
              <p className="text-gray-600 mt-1">
                Required passing score: {quiz.passScore}%
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 text-center">
              <div className="inline-flex items-center justify-center h-24 w-24 rounded-full border-4 border-gray-200">
                <div className={`text-2xl font-bold ${
                  scorePercentage >= 80 ? 'text-green-600' :
                  scorePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {scorePercentage.toFixed(1)}%
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Score: {attempt.score} / {attempt.maxScore} points
              </p>
            </div>
          </div>
        </div>
        
        {/* Detailed answers */}
        <h3 className="text-xl font-semibold mb-4">Question Review</h3>
        {attempt.answers.map((answer, index) => {
          const question = answer.questionId;
          return (
            <div 
              key={index} 
              className={`p-4 rounded-lg mb-4 ${
                answer.isCorrect ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <h4 className="text-lg font-semibold">Question {index + 1}</h4>
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                  answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {answer.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>
              
              <p className="my-2">{question.text}</p>
              
              <div className="mt-2">
                <div className="font-semibold">Your answer:</div>
                <div className="pl-2 py-1">
                  {Array.isArray(answer.selectedAnswer) 
                    ? answer.selectedAnswer.join(', ') 
                    : answer.selectedAnswer || 'No answer provided'}
                </div>
              </div>
              
              {!answer.isCorrect && (
                <div className="mt-2">
                  <div className="font-semibold text-green-700">Correct answer:</div>
                  <div className="pl-2 py-1">
                    {question.options
                      .filter(opt => opt.isCorrect)
                      .map(opt => opt.text)
                      .join(', ')}
                  </div>
                </div>
              )}
              
              {question.explanation && (
                <div className="mt-2 bg-blue-50 p-2 rounded">
                  <div className="font-semibold text-blue-700">Explanation:</div>
                  <div className="pl-2 py-1 text-gray-700">{question.explanation}</div>
                </div>
              )}
              
              <div className="mt-2 text-sm text-gray-500">
                Points: {answer.pointsEarned} / {question.points}
              </div>
            </div>
          );
        })}
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
          <Link 
            to={`/quiz/${quizId}`} 
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded text-center"
          >
            View Quiz Details
          </Link>
          <Link 
            to="/quizzes" 
            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded text-center"
          >
            Browse More Quizzes
          </Link>
          <Link 
            to="/history" 
            className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-6 rounded text-center"
          >
            View Quiz History
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;