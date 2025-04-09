// src/components/dashboard/Dashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import AuthContext from '../../contexts/AuthContext';

const Dashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch recent quizzes
        const quizzesResponse = await api.get('/quizzes?limit=3');
        setRecentQuizzes(quizzesResponse.data.quizzes);
        
        // Fetch user's recent attempts
        const attemptsResponse = await api.get('/attempts/my-attempts?limit=5');
        setRecentAttempts(attemptsResponse.data.attempts);
        
        setError(null);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Loading dashboard...</p>
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Welcome, {currentUser.name}!</h1>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">Quizzes Taken</h3>
          <p className="text-3xl font-bold text-blue-600">{recentAttempts.length}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">Average Score</h3>
          <p className="text-3xl font-bold text-green-600">
            {recentAttempts.length > 0 
              ? `${Math.round(recentAttempts.reduce((acc, attempt) => acc + attempt.score, 0) / recentAttempts.length)}%` 
              : 'N/A'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">Last Quiz</h3>
          <p className="text-lg font-medium">
            {recentAttempts.length > 0 
              ? recentAttempts[0].quiz.title 
              : 'No quizzes taken yet'}
          </p>
        </div>
      </div>

      {/* Recent Quizzes */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Recent Quizzes</h2>
          <Link to="/" className="text-blue-500 hover:text-blue-700">View All</Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentQuizzes.length > 0 ? (
            recentQuizzes.map(quiz => (
              <div key={quiz._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-5">
                  <h3 className="text-xl font-bold mb-2">{quiz.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{quiz.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{quiz.questions?.length || 0} questions</span>
                    <Link 
                      to={`/quiz/${quiz._id}`}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    >
                      Start Quiz
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-3 text-center text-gray-500">No quizzes available.</p>
          )}
        </div>
      </div>

      {/* Recent Attempts */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Recent Attempts</h2>
          <Link to="/my-attempts" className="text-blue-500 hover:text-blue-700">View All</Link>
        </div>
        
        {recentAttempts.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentAttempts.map(attempt => (
                  <tr key={attempt._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{attempt.quiz.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(attempt.createdAt).toLocaleDateString()}
                      </div>
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
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500">No quiz attempts yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;