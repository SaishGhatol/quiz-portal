import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import {
  BarChart, Activity, Users, FileText, Clock, Calendar, User, CheckCircle, AlertCircle, TrendingUp, RefreshCw, Loader
} from 'lucide-react';

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
        const response = await api.get('/attempts/all');
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

    const updateActiveUserCount = (isActive) => {
      setStats(prevStats => ({
        ...prevStats,
        activeUsers: isActive 
          ? prevStats.activeUsers + 1 
          : Math.max(0, prevStats.activeUsers - 1)
      }));
    };

    const handleAccountStatus = async (userId, isActive) => {
      try {
        await api.put(`/users/${userId}`, { isActive });
        
        // Update users list
        setUsers(users.map(user =>
          user._id === userId ? { ...user, isActive } : user
        ));
        
        // Update active user count
        const userWasActive = users.find(user => user._id === userId)?.isActive;
        if (userWasActive !== isActive) {
          updateActiveUserCount(isActive);
        }
        
        toast.success(`User account ${isActive ? 'activated' : 'deactivated'} successfully`);
        
        // Update selected user if applicable
        if (selectedUser && selectedUser._id === userId) {
          setSelectedUser({ ...selectedUser, isActive });
        }
      } catch (error) {
        console.error('Error updating user status:', error);
        toast.error(error.response?.data?.message || 'Failed to update user status');
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

  useEffect(() => {
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
      <div className="flex items-center justify-center min-h-64 bg-white rounded-lg shadow-md">
        <div className="text-center p-10">
          <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if we have critical errors that prevent rendering the dashboard
  const hasCriticalErrors = errors.stats && errors.quizzes && errors.attempts;

  if (hasCriticalErrors) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="max-w-lg p-8 bg-white rounded-2xl shadow-lg">
          <div className="flex items-center justify-center mb-6 text-red-500">
            <AlertCircle size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-8 text-center">
            We're having trouble connecting to the server. Please check your connection and try again.
          </p>
          <button
            onClick={fetchDashboardData}
            className="w-full py-3 px-6 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition duration-200"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }


  return (

    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Dashboard updated as of {formatDate(new Date())}</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Stats Overview */}
        <div className="mb-8">
          {errors.stats && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div className="ml-3">
                  <p className="text-red-700">{errors.stats}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Quizzes Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition duration-300">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-xl bg-indigo-50">
                    <FileText className="h-7 w-7 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Quizzes</p>
                    <div className="flex items-baseline">
                      <p className="text-3xl font-bold text-gray-900">{stats.totalQuizzes.toLocaleString()}</p>
                      <p className="ml-2 text-sm text-indigo-500 font-medium flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Active
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Users Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition duration-300">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-xl bg-emerald-50">
                    <Users className="h-7 w-7 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Users</p>
                    <div className="flex items-baseline">
                      <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                      <p className="ml-2 text-sm text-emerald-500 font-medium flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Growing
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Attempts Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition duration-300">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-xl bg-blue-50">
                    <Activity className="h-7 w-7 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Attempts</p>
                    <div className="flex items-baseline">
                      <p className="text-3xl font-bold text-gray-900">{stats.totalAttempts.toLocaleString()}</p>
                      <p className="ml-2 text-sm text-blue-500 font-medium flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Active
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Quizzes */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-indigo-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Recent Quizzes</h2>
              </div>
              <Link
                to="/admin/quizzes"
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="p-6">
              {errors.quizzes ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <div className="ml-3">
                      <p className="text-red-700">{errors.quizzes}</p>
                    </div>
                  </div>
                </div>
              ) : recentQuizzes.length > 0 ? (
                <div className="space-y-4">
                  {recentQuizzes.map(quiz => (
                    <div key={quiz._id} className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate">{quiz.title}</h3>
                          <div className="flex flex-wrap mt-2 gap-y-2 gap-x-4">
                            <div className="flex items-center text-sm text-gray-500">
                              <User className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="truncate">{quiz.createdBy?.name || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                              <span>{formatDate(quiz.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <Link
                          to={`/admin/quizzes/${quiz._id}/statistics`}
                          className="ml-4 px-3 py-1 bg-indigo-50 rounded-full text-indigo-600 text-sm font-medium hover:bg-indigo-100 transition-colors duration-200"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="mx-auto h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 mb-1">No recent quizzes</h3>
                  <p className="text-sm text-gray-500">Create a new quiz to get started.</p>
                  <Link
                    to="/admin/quizzes/create"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Create Quiz
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Attempts */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-blue-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Recent Attempts</h2>
              </div>
              <Link
                to="/admin/attempts/all"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="p-6">
              {errors.attempts ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <div className="ml-3">
                      <p className="text-red-700">{errors.attempts}</p>
                    </div>
                  </div>
                </div>
              ) : recentAttempts.length > 0 ? (
                <div className="space-y-4">
                  {recentAttempts.map(attempt => (
                    <div key={attempt._id} className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <h3 className="text-base font-semibold text-gray-900 truncate">{attempt.user?.name || 'Anonymous'}</h3>
                          </div>
                          <div className="flex flex-wrap mt-2 gap-y-2 gap-x-4">
                            <div className="flex items-center text-sm text-gray-500">
                              <FileText className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="truncate">{attempt.quiz?.title || 'Unknown Quiz'}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 text-gray-400 mr-1" />
                              <span>{formatDate(attempt.completedAt)}</span>
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
                <div className="text-center py-10">
                  <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 mb-1">No recent attempts</h3>
                  <p className="text-sm text-gray-500">Users will appear here after taking quizzes.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/admin/quizzes/create"
                  className="group flex items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors duration-200"
                >
                  <div className="flex-shrink-0 p-3 rounded-full bg-white mr-4 group-hover:bg-indigo-50 transition-colors duration-200">
                    <FileText className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Create Quiz</h3>
                    <p className="text-sm text-gray-500 mt-1">Add a new quiz to your collection</p>
                  </div>
                </Link>

                <Link
                  to="/admin/users"
                  className="group flex items-center p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors duration-200"
                >
                  <div className="flex-shrink-0 p-3 rounded-full bg-white mr-4 group-hover:bg-emerald-50 transition-colors duration-200">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Manage Users</h3>
                    <p className="text-sm text-gray-500 mt-1">View and manage user accounts</p>
                  </div>
                </Link>

                <Link
                  to="/admin/quizzes"
                  className="group flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                >
                  <div className="flex-shrink-0 p-3 rounded-full bg-white mr-4 group-hover:bg-blue-50 transition-colors duration-200">
                    <BarChart className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Manages Quizzes</h3>
                    <p className="text-sm text-gray-500 mt-1">Access all Quizzes</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;