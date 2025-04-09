// src/components/profile/AttemptDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';

const AttemptDetail = () => {
  const { id } = useParams();
  
  const [attemptData, setAttemptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchAttemptDetail = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/attempts/${id}`);
        setAttemptData(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching attempt details:', error);
        setError('Failed to load attempt details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttemptDetail();
  }, [id]);
  
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
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Loading attempt details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <Link to="/my-attempts" className="mt-4 inline-block text-blue-500 hover:text-blue-700">
          Back to My Attempts
        </Link>
      </div>
    );
  }
  
  if (!attemptData || !attemptData.attempt || !attemptData.quiz) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Attempt not found.</p>
        <Link to="/my-attempts" className="mt-4 inline-block text-blue-500 hover:text-blue-700">
          Back to My Attempts
        </Link>
      </div>
    );
  }
  
  const { attempt, quiz } = attemptData;
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Attempt Details</h1>
        <Link to="/my-attempts" className="text-blue-500 hover:text-blue-700">
          Back to All Attempts
        </Link>
      </div>
      
      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">{quiz.title}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Date Completed</p>
            <p className="font-medium">{formatDate(attempt.completedAt || attempt.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Score</p>
            <p className="font-medium">
              <span className={`inline-block px-2 py-1 rounded-full text-sm ${getScoreBadgeColor(attempt.score)}`}>
                {attempt.score}%
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Time Taken</p>
            <p className="font-medium">{attempt.timeTaken ? `${Math.floor(attempt.timeTaken / 60)}m ${attempt.timeTaken % 60}s` : 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Link 
            to={`/quiz/${quiz._id}`} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Retake Quiz
          </Link>
        </div>
      </div>
      
      {/* Questions and Answers */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Questions and Answers</h2>
        
        <div className="space-y-6">
          {quiz.questions.map((question, index) => {
            const userAnswer = attempt.answers.find(a => a.questionId === question._id);
            const correctOption = question.options.find(o => o.correct);
            const userSelectedOption = userAnswer ? question.options[userAnswer.selectedOption] : null;
            
            return (
              <div key={question._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <p className="font-semibold mb-2">
                  {index + 1}. {question.text}
                </p>
                
                <div className="ml-4 space-y-1">
                  {question.options.map((option, optIndex) => (
                    <div 
                      key={option._id} 
                      className={`p-2 rounded ${
                        userAnswer && userAnswer.selectedOption === optIndex
                          ? userAnswer.isCorrect 
                            ? 'bg-green-100 border-green-500 border' 
                            : 'bg-red-100 border-red-500 border'
                          : option.correct 
                            ? 'bg-gray-100' 
                            : ''
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
                      <p className="text-green-600">Correct! You selected the right answer.</p>
                    ) : (
                      <p className="text-red-600">
                        Incorrect. You selected {userSelectedOption ? userSelectedOption.text : 'no answer'}.
                        The correct answer is: {correctOption.text}.
                      </p>
                    )
                  ) : (
                    <p className="text-yellow-600">No answer provided.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AttemptDetail;