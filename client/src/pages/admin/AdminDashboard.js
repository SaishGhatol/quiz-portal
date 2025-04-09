import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalUsers: 0,
    totalAttempts: 0,
    recentAttempts: [],
    quizzesByCategory: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch stats from backend
        const statsResponse = await api.get('/admin/stats');
        setStats(statsResponse.data);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Error fetching admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Total Quizzes</h2>
            <span className="text-3xl font-bold text-blue-600">{stats.totalQuizzes}</span>
          </div>
          <Link to="/admin/quizzes" className="text-blue-500 hover:text-blue-700">
            Manage Quizzes →
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Total Users</h2>
            <span className="text-3xl font-bold text-green-600">{stats.totalUsers}</span>
          </div>
          <Link to="/admin/users" className="text-blue-500 hover:text-blue-700">
            Manage Users →
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Quiz Attempts</h2>
            <span className="text-3xl font-bold text-purple-600">{stats.totalAttempts}</span>
          </div>
          <p className="text-gray-600">Total quiz attempts by all users</p>
        </div>
      </div>
      
      {/* Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/quizzes/create" className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded text-center">
            Create New Quiz
          </Link>
          <Link to="/admin/users" className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded text-center">
            Manage Users
          </Link>
          <Link to="/admin/quizzes" className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded text-center">
            Manage Quizzes
          </Link>
          <Link to="/quizzes" className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded text-center">
            View Portal as User
          </Link>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Quiz Attempts</h2>
          
          {stats.recentAttempts && stats.recentAttempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">User</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Quiz</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Score</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.recentAttempts.map((attempt) => (
                    <tr key={attempt._id}>
                      <td className="px-4 py-2">{attempt.userName}</td>
                      <td className="px-4 py-2">{attempt.quizTitle}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          attempt.percentage >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {attempt.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {new Date(attempt.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No recent attempts found.</p>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Quizzes by Category</h2>
          
          {stats.quizzesByCategory && Object.keys(stats.quizzesByCategory).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(stats.quizzesByCategory).map(([category, count]) => (
                <div key={category} className="flex items-center">
                  <div className="w-32 font-medium">{category}</div>
                  <div className="flex-1">
                    <div className="bg-gray-200 h-4 rounded-full">
                      <div 
                        className="bg-blue-500 h-4 rounded-full"
                        style={{ width: `${(count / stats.totalQuizzes) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-10 text-right ml-2">{count}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No categories found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;