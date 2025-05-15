import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import AuthContext from '../../contexts/AuthContext';
import {Loader} from "lucide-react";
const QuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAttempts, setUserAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/quizzes/${id}`);
        setQuiz(response.data.quiz);
        setError(null);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        const errorMessage = error.response?.data?.message || 'Failed to load quiz. Please try again later.';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  useEffect(() => {
    const fetchQuestionCount = async () => {
      if (id) {
        try {
          const questionsRes = await api.get(`/quizzes/${id}/questions`);
          setQuestionCount(questionsRes.data.questions.length);
        } catch (err) {
          console.error(`Error fetching questions for quiz ${id}:`, err);
          setQuestionCount(0);
        }
      }
    };
    
    fetchQuestionCount();
  }, [id]);


  const handleStartQuiz = () => {
    navigate(`/quiz/${id}/take`);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-white rounded-lg shadow-md">
        <div className="text-center p-10">
          <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your quiz Details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 max-w-md mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
        <Link 
          to="/quizzes" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Quizzes
        </Link>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-10 max-w-md mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M12 14a2 2 0 100-4 2 2 0 000 4z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Quiz Not Found</h3>
          <p className="text-yellow-700">The quiz you're looking for doesn't exist or has been removed.</p>
        </div>
        <Link 
          to="/quizzes" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Browse Quizzes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold">{quiz.title}</h1>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full w-fit ${getDifficultyColor(quiz.difficulty)}`}>
              {quiz.difficulty || 'Unknown difficulty'}
            </span>
          </div>
          
          <p className="text-gray-700 mb-6">{quiz.description}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-gray-500">Category</div>
              <div className="font-medium">{quiz.category || 'Uncategorized'}</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-gray-500">Number of Questions</div>
              <div className="font-medium">{questionCount}</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-gray-500">Time Limit</div>
              <div className="font-medium">{quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No time limit'}</div>
            </div>
          </div>
          
          {currentUser ? (
            <div className="space-y-6">
              <button
                onClick={handleStartQuiz}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md font-medium w-full sm:w-auto flex justify-center items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Quiz
              </button>
            
            </div>
          ) : (
            <div className="bg-blue-50 p-4 rounded-md flex items-start space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-blue-700">
                  Please <Link to="/login" className="font-bold underline">log in</Link> to take this quiz and track your progress.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizDetail;