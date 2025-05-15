import React, { useState, useEffect } from 'react';
import { Link ,useParams} from 'react-router-dom';
import api from '../../utils/api';
import { 
  BarChart, Filter, Trophy, Clock, ArrowDownUp, 
  BookOpen, CheckCircle, FileSpreadsheet, Calendar, 
  Eye, RefreshCw, PlusCircle, Search, X, Tag, Loader
} from 'lucide-react';

const UserAttempts = () => {
  const { id } = useParams();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statsVisible, setStatsVisible] = useState(true);
  
  useEffect(() => {
    const fetchAttempts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        params.append('sortBy', filters.sortBy);
        params.append('sortOrder', filters.sortOrder);
        
        // API call with query parameters
        const response = await api.get('/attempts/user');
        
        // Set attempts from the response
        if (response.data && response.data.attempts) {
          setAttempts(response.data.attempts);
        } else {
          setAttempts([]);
        }
        setError(null);
      } catch (error) {        
        if (error.response && error.response.status === 404) {
          setAttempts([]);
        } else {
          setError(`Failed to load your quiz attempts. ${error.response?.data?.message || error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttempts();
    
  }, [filters]);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const toggleStats = () => {
    setStatsVisible(!statsVisible);
  };
  
  const getScoreBadgeColor = (score, maxScore) => {
    // Calculate percentage score if both score and maxScore are available
    let percentageScore;
    if (score !== null && score !== undefined && maxScore) {
      percentageScore = (score / maxScore) * 100;
    } else {
      percentageScore = score || 0;
    }
    
    if (percentageScore >= 80) return 'bg-green-100 text-green-800';
    if (percentageScore >= 60) return 'bg-blue-100 text-blue-800';
    if (percentageScore >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    try {
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatScore = (score, maxScore) => {
    if (score === null || score === undefined) return 'N/A';
    if (maxScore) return `${score}/${maxScore} (${Math.round((score / maxScore) * 100)}%)`;
    return `${maxScore} pts`;
  };

  // Helper function to safely access quiz properties
  const getQuizProperty = (attempt, property, defaultValue = 'Unknown') => {
    if (!attempt) return defaultValue;
    if (attempt.quiz && attempt.quiz[property] !== undefined && attempt.quiz[property] !== null) {
      return attempt.quiz[property];
    }
    return defaultValue;
  };

  // Filter attempts based on search term
  const filteredAttempts = attempts.filter(attempt => {
    const quizTitle = getQuizProperty(attempt, 'title', '').toLowerCase();
    const category = getQuizProperty(attempt, 'category', '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return quizTitle.includes(searchLower) || category.includes(searchLower);
  });
  
  // Calculate statistics
  const stats = {
    total: attempts.length,
    completed: attempts.filter(a => a.completedAt).length,
    avgScore: attempts.length > 0 ? 
      Math.round(attempts.reduce((sum, a) => {
        if (a.score !== null && a.score !== undefined && a.maxScore) {
          return sum + ((a.score / a.maxScore) * 100);
        }
        return sum;
      }, 0) / attempts.filter(a => a.score !== null && a.score !== undefined && a.maxScore).length) : 0,
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-white rounded-lg shadow-md">
        <div className="text-center p-10">
          <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your quiz attempts...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center space-x-3 text-red-600 mb-4">
          <X className="h-6 w-6" />
          <h2 className="text-lg font-semibold">Error Loading Attempts</h2>
        </div>
        <p className="text-gray-700">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with improved layout */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4  p-6 rounded-lg shadow-lg text-white">
        <div>
          <h1 className="text-2xl font-bold flex items-center text-neutral-900">
            <FileSpreadsheet className="mr-2 h-6 w-6" />
            Your Quiz Attempts
          </h1>
          <p className="mt-1 text-neutral-900">Track your progress and view past quiz results</p>
        </div>
        <Link to="/quizzes" className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <PlusCircle className="h-4 w-4 mr-2" />
          Take New Quiz
        </Link>
      </div>
      
      {/* Stats Dashboard */}
      {attempts.length > 0 && (
        <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ${statsVisible ? 'max-h-96' : 'max-h-16'}`}>
          <div 
            className="flex justify-between items-center px-6 py-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
            onClick={toggleStats}
          >
            <div className="flex items-center">
              <BarChart className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="font-semibold text-gray-700">Quiz Performance Dashboard</h2>
            </div>
            <button className="text-gray-500 hover:text-gray-700">
              {statsVisible ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard 
                icon={<FileSpreadsheet className="h-8 w-8 text-blue-500" />}
                title="Total Attempts"
                value={stats.total}
                color="blue"
              />
              <StatCard 
                icon={<CheckCircle className="h-8 w-8 text-green-500" />}
                title="Completed"
                value={stats.completed}
                color="green"
              />
              <StatCard 
                icon={<Trophy className="h-8 w-8 text-purple-500" />}
                title="Avg. Score"
                value={`${stats.avgScore}%`}
                color="purple"
              />
            </div>
            
            
          </div>
        </div>
      )}
      
      {/* Filters Panel */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4 text-gray-700">
          <Filter className="h-5 w-5 mr-2 text-blue-600" />
          <h2 className="font-semibold">Filter & Search Attempts</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Search Input */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Quiz Title</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by title or category..."
                className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
          
        
          {/* Sort Controls */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <select
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={handleFilterChange}
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="createdAt">Date</option>
                  <option value="score">Score</option>
                  <option value="quiz.title">Quiz Name</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <ArrowDownUp className="h-4 w-4" />
                </div>
              </div>
              
              <div className="relative flex-1">
                <select
                  name="sortOrder"
                  value={filters.sortOrder}
                  onChange={handleFilterChange}
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <ArrowDownUp className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Attempts List */}
      {attempts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex flex-col items-center">
            <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">You haven't taken any quizzes yet.</p>
            <Link to="/quizzes" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center">
              <PlusCircle className="h-4 w-4 mr-2" />
              Browse Available Quizzes
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Results Summary */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm text-sm text-gray-600">
            {filteredAttempts.length === 0 ? (
              <p>No quiz attempts match your search criteria.</p>
            ) : (
              <p>Showing {filteredAttempts.length} of {attempts.length} total quiz attempts.</p>
            )}
          </div>
        
          {filteredAttempts.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAttempts.map((attempt) => (
                      <tr key={attempt._id || `temp-${Math.random()}`} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getQuizProperty(attempt, 'title', 'Untitled Quiz')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(attempt.startedAt || attempt.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getScoreBadgeColor(attempt.score, attempt.maxScore)}`}>
                            {formatScore(attempt.score, attempt.maxScore)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {attempt.completedAt ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              In Progress
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-3">
                            <Link 
                              to={`/attempts/${attempt._id}`} 
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Link>
                            {attempt.quiz && attempt.quiz._id && (
                              <Link 
                                to={`/quiz/${attempt.quiz._id}`} 
                                className="text-green-600 hover:text-green-900 flex items-center"
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                {attempt.completedAt ? 'Retake Quiz' : 'Continue Quiz'}
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, title, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    yellow: 'bg-yellow-50 border-yellow-100',
    purple: 'bg-purple-50 border-purple-100',
  };
  
  return (
    <div className={`${colorClasses[color] || 'bg-gray-50 border-gray-100'} border rounded-lg p-4 flex items-center`}>
      <div className="mr-4">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
};

// Simple icons for chevron
const ChevronUpIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default UserAttempts;