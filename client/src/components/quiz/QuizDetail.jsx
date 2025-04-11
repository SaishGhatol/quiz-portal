import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import AuthContext from '../../contexts/AuthContext';

const QuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAttempts, setUserAttempts] = useState([]);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/quizzes/${id}`);
        setQuiz(response.data.quiz);
        
        // If user is logged in, fetch their attempts for this quiz
        if (currentUser) {
          // Changed endpoint to include the quiz ID as a query parameter
          const attemptsResponse = await api.get(`/attempts/my-attempts?quiz=${id}`);
          setUserAttempts(attemptsResponse.data.attempts);
        }
        
        setError(null);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        if (error.response && error.response.status === 404) {
          // Handle the specific 404 error
          if (error.response.data.message === 'Attempt not found') {
            // Set empty attempts array instead of throwing an error
            setUserAttempts([]);
          } else {
            setError('Quiz not found. Please check the URL and try again.');
          }
        } else {
          setError('Failed to load quiz. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id, currentUser]);

  const handleStartQuiz = () => {
    navigate(`/quiz/${id}/take`);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
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

  if (!quiz) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Quiz not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold">{quiz.title}</h1>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getDifficultyColor(quiz.difficulty)}`}>
              {quiz.difficulty}
            </span>
          </div>
          
          <p className="text-gray-700 mb-6">{quiz.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-gray-500">Category</div>
              <div className="font-medium">{quiz.category}</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-gray-500">Number of Questions</div>
              <div className="font-medium">{quiz.totalQuestions || 0}</div>
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
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md font-medium w-full md:w-auto"
              >
                Start Quiz
              </button>
              
              {/* User's previous attempts */}
              {userAttempts.length > 0 ? (
                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-4">Your Previous Attempts</h2>
                  <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userAttempts.map((attempt) => (
                          <tr key={attempt._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(attempt.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                attempt.score >= 70 ? 'bg-green-100 text-green-800' : 
                                attempt.score >= 40 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {attempt.score}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Link 
                                to={`/attempts/${attempt._id}`}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                View Results
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="mt-8 bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-600">You haven't attempted this quiz yet.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-blue-700">
                Please <Link to="/login" className="font-bold underline">log in</Link> to take this quiz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizDetail;