import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';




const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalUsers: 0,
    totalAttempts: 0,
    activeUsers: 0
  });
  
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({
    stats: null,
    quizzes: null,
    attempts: null
  });
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      // Reset errors
      setErrors({
        stats: null,
        quizzes: null,
        attempts: null
      });
      
      // Create individual fetch functions with retry capability
      const fetchStats = async (retryCount = 0) => {
        try {
          const response = await api.get('/admin/dashboard/stats');
          return response.data;
        } catch (error) {
          if (retryCount < 2 && (error.response?.status === 500 || !error.response)) {
            console.log(`Retrying stats fetch (${retryCount + 1}/2)...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchStats(retryCount + 1);
          }
          
          const errorMessage = error.response?.data?.message || 'Unable to fetch statistics';
          setErrors(prev => ({ ...prev, stats: errorMessage }));
          return null;
        }
      };
      
      const fetchQuizzes = async (retryCount = 0) => {
        try {
          const response = await api.get('/admin/quizzes/recent?limit=5');
          return response.data.quizzes;
        } catch (error) {
          if (retryCount < 2 && (error.response?.status === 500 || !error.response)) {
            console.log(`Retrying quizzes fetch (${retryCount + 1}/2)...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchQuizzes(retryCount + 1);
          }
          
          const errorMessage = error.response?.data?.message || 'Unable to fetch recent quizzes';
          setErrors(prev => ({ ...prev, quizzes: errorMessage }));
          return [];
        }
      };
      
      const fetchAttempts = async (retryCount = 0) => {
        try {
          const response = await api.get('/admin/attempts?limit=5');
          return response.data.attempts;
        } catch (error) {
          if (retryCount < 2 && (error.response?.status === 500 || !error.response)) {
            console.log(`Retrying attempts fetch (${retryCount + 1}/2)...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchAttempts(retryCount + 1);
          }
          
          const errorMessage = error.response?.data?.message || 'Unable to fetch recent attempts';
          setErrors(prev => ({ ...prev, attempts: errorMessage }));
          return [];
        }
      };
      
      // Execute all fetches in parallel for better performance
      const results = await Promise.all([
        fetchStats(),
        fetchQuizzes(),
        fetchAttempts()
      ]);
      
      // Set states based on results
      if (results[0]) setStats(results[0]);
      if (results[1]) setRecentQuizzes(results[1]);
      if (results[2]) setRecentAttempts(results[2]);
      
      setLoading(false);
    };
    
    fetchDashboardData();
  }, []);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Loading dashboard data...</p>
      </div>
    );
  }
  
  // Check if we have critical errors that prevent rendering the dashboard
  const hasCriticalErrors = errors.stats && errors.quizzes && errors.attempts;
  
  if (hasCriticalErrors) {
    return (
      <div className="text-center py-10">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">Failed to load dashboard data. Please try again later.</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Page
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {errors.stats && (
          <div className="md:col-span-4 bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{errors.stats}</p>
          </div>
        )}
        
        {/* Total Quizzes Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Quizzes</p>
              <p className="text-2xl font-semibold">{stats.totalQuizzes}</p>
            </div>
          </div>
        </div>

        {/* Total Users Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Users</p>
              <p className="text-2xl font-semibold">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        {/* Total Attempts Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Attempts</p>
              <p className="text-2xl font-semibold">{stats.totalAttempts}</p>
            </div>
          </div>
        </div>

        {/* Active Users Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Active Users</p>
              <p className="text-2xl font-semibold">{stats.activeUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quizzes */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Quizzes</h2>
          {errors.quizzes ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-red-700">{errors.quizzes}</p>
            </div>
          ) : recentQuizzes.length > 0 ? (
            <div className="space-y-4">
              {recentQuizzes.map(quiz => (
                <div key={quiz._id} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{quiz.title}</h3>
                      <p className="text-sm text-gray-500">
                        Created by {quiz.createdBy?.name || 'Unknown'} • {formatDate(quiz.createdAt)}
                      </p>
                    </div>
                    <Link 
                      to={`/admin/quizzes/${quiz._id}`}
                      className="text-blue-500 hover:text-blue-600 text-sm"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent quizzes found</p>
          )}
          <div className="mt-4 text-right">
            <Link 
              to="/admin/quizzes" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View All Quizzes
            </Link>
          </div>
        </div>

        {/* Recent Attempts */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Attempts</h2>
          {errors.attempts ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-red-700">{errors.attempts}</p>
            </div>
          ) : recentAttempts.length > 0 ? (
            <div className="space-y-4">
              {recentAttempts.map(attempt => (
                <div key={attempt._id} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{attempt.user?.name || 'Anonymous'}</h3>
                      <p className="text-sm text-gray-500">
                        {attempt.quiz?.title || 'Unknown Quiz'} • Score: {attempt.score || 0}% • {formatDate(attempt.completedAt)}
                      </p>
                    </div>
                    <Link
                      to={`/admin/attempts/${attempt._id}`}
                      className="text-blue-500 hover:text-blue-600 text-sm"
                    >
                      Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent attempts found</p>
          )}
          <div className="mt-4 text-right">
            <Link 
              to="/admin/attempts" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View All Attempts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;