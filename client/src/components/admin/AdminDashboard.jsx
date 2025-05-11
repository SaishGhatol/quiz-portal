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
          const response = await api.get('/admin/quizzes');
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
          // Change this to fetch recent attempts without requiring a quiz ID
          const response = await api.get('/admin/attempts/recent');
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
      
      const results = await Promise.all([
        fetchStats(),
        fetchQuizzes(),
        fetchAttempts()
      ]);
      
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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }
  
  // Check if we have critical errors that prevent rendering the dashboard
  const hasCriticalErrors = errors.stats && errors.quizzes && errors.attempts;
  
  if (hasCriticalErrors) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-lg">
          <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-700 font-medium">Failed to load dashboard data. Please try again later.</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md flex items-center justify-center mx-auto"
          >
            <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview and recent activity</p>
      </div>
      
      {/* Stats Overview */}
      <div className="mb-10">
        {errors.stats && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-700">{errors.stats}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Quizzes Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100">
            <div className="p-6">
              <div className="flex items-start">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Quizzes</h3>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalQuizzes.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Total Users Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100">
            <div className="p-6">
              <div className="flex items-start">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Users</h3>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Total Attempts Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100">
            <div className="p-6">
              <div className="flex items-start">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Attempts</h3>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalAttempts.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Users Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100">
            <div className="p-6">
              <div className="flex items-start">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Active Users</h3>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Quizzes */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Recent Quizzes</h2>
          </div>
          <div className="p-6">
            {errors.quizzes ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-red-700">{errors.quizzes}</p>
                  </div>
                </div>
              </div>
            ) : recentQuizzes.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentQuizzes.map(quiz => (
                  <div key={quiz._id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 truncate">{quiz.title}</h3>
                        <div className="flex items-center mt-1">
                          <svg className="h-4 w-4 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <p className="text-sm text-gray-500 truncate">{quiz.createdBy?.name || 'Unknown'}</p>
                        </div>
                        <div className="flex items-center mt-1">
                          <svg className="h-4 w-4 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-gray-500">{formatDate(quiz.createdAt)}</p>
                        </div>
                      </div>
                      <Link 
                        to={`/admin/quizzes/${quiz._id}`}
                        className="ml-4 px-3 py-1 bg-blue-50 rounded-full text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors duration-200"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="h-12 w-12 text-gray-300 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500">No recent quizzes found</p>
              </div>
            )}
            <div className="mt-6 text-right">
              <Link 
                to="/admin/quizzes" 
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Quizzes
                <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Attempts */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Recent Attempts</h2>
          </div>
          <div className="p-6">
            {errors.attempts ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-red-700">{errors.attempts}</p>
                  </div>
                </div>
              </div>
            ) : recentAttempts.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentAttempts.map(attempt => (
                  <div key={attempt._id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 truncate">{attempt.user?.name || 'Anonymous'}</h3>
                        <div className="flex items-center mt-1">
                          <svg className="h-4 w-4 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="text-sm text-gray-500 truncate">{attempt.quiz?.title || 'Unknown Quiz'}</p>
                        </div>
                        <div className="flex items-center mt-1 space-x-4">
                          <div className="flex items-center">
                            <svg className="h-4 w-4 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p className="text-sm text-gray-500">
                              <span className={attempt.score >= 70 ? 'text-green-600 font-medium' : attempt.score >= 40 ? 'text-yellow-600 font-medium' : 'text-red-600 font-medium'}>
                                {attempt.score || 0}%
                              </span>
                            </p>
                          </div>
                          <div className="flex items-center">
                            <svg className="h-4 w-4 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-gray-500">{formatDate(attempt.completedAt)}</p>
                          </div>
                        </div>
                      </div>
                      <Link
                        to={`/admin/attempts/${attempt._id}`}
                        className="ml-4 px-3 py-1 bg-blue-50 rounded-full text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors duration-200"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="h-12 w-12 text-gray-300 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p className="text-gray-500">No recent attempts found</p>
              </div>
            )}
            <div className="mt-6 text-right">
              <Link 
                to="/admin/attempts" 
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Attempts
                <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;