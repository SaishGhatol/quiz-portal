import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Clipboard, Edit, BarChart2, Trash2, Plus, HelpCircle, AlertTriangle, Search, Filter, ChevronDown, Eye, Grid, List, CheckCircle, Clock, CircleHelp,Loader } from 'lucide-react';

const ManageQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/quizzes/recent');

      // Fetch question counts for each quiz
      const quizzesWithQuestions = await Promise.all(
        response.data.quizzes.map(async (quiz) => {
          try {
            const questionsRes = await api.get(`/quizzes/${quiz._id}/questions`);
            return {
              ...quiz,
              questionCount: questionsRes.data.questions.length,
              lastUpdated: new Date(quiz.updatedAt || quiz.createdAt).toLocaleDateString()
            };
          } catch (err) {
            console.error(`Error fetching questions for quiz ${quiz._id}:`, err);
            return {
              ...quiz,
              questionCount: 0,
              lastUpdated: new Date(quiz.updatedAt || quiz.createdAt).toLocaleDateString()
            };
          }
        })
      );

      setQuizzes(quizzesWithQuestions);
      setError(null);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setError('Failed to load quizzes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;

    try {
      await api.delete(`/quizzes/${quizId}`);
      toast.success('Quiz deleted successfully');
      setQuizzes(quizzes.filter(quiz => quiz._id !== quizId));
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    }
  };

  const filteredQuizzes = quizzes
    .filter(quiz => {
      // Filter by search term
      if (searchTerm && !quiz.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filter by status
      if (filterStatus === 'published' && !quiz.isPublished) return false;
      if (filterStatus === 'draft' && quiz.isPublished) return false;

      return true;
    })
    .sort((a, b) => {
      // Sort by selected criteria
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'questions') {
        return b.questionCount - a.questionCount;
      }
      return 0;
    });

  
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-64 bg-white rounded-lg shadow-md">
          <div className="text-center p-10">
            <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading Manage Quizzes...</p>
          </div>
        </div>
      );
    }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 shadow-md">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-red-800">Error Loading Quizzes</h3>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchQuizzes}
            className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manage Quizzes</h1>
          <p className="mt-2 text-sm text-gray-600">Create, edit and manage your interactive quizzes</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
          <Link
            to="/admin/quizzes/create"
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Quiz
          </Link>
          <button
            onClick={() => navigate('/admin')}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors cursor-pointer"
          >
            <span className="mr-2">←</span>
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

      
      </div>

      {/* Empty State */}
      {quizzes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-6">
            <HelpCircle className="h-10 w-10 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Quizzes Created Yet</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">Get started by creating your first quiz and engage your audience with interactive content!</p>
          <Link
            to="/admin/quizzes/create"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-150 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Your First Quiz
          </Link>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-2">No Matching Quizzes</h3>
          <p className="text-gray-600 mb-6">We couldn't find any quizzes matching your search criteria.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('all');
              setSortBy('newest');
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map(quiz => (
            <div key={quiz._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{quiz.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{quiz.description || "No description provided"}</p>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-500 mt-4 mb-5">
                  <div className="flex items-center mr-6">
                    <HelpCircle className="w-4 h-4 mr-1 text-blue-500" />
                    <span>{quiz.questionCount} {quiz.questionCount === 1 ? 'question' : 'questions'}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-gray-400" />
                    <span>Updated {quiz.lastUpdated}</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-2">
                  <div className="flex justify-between">
                    <Link
                      to={`/admin/quizzes/${quiz._id}/edit`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Link>
                    <Link
                      to={`/admin/quizzes/${quiz._id}/questions`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                      <CircleHelp className="w-4 h-4 mr-1" />
                      Questions
                    </Link>
                    <Link
                      to={`/admin/quizzes/${quiz._id}/statistics`}
                      className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
                    >
                      <BarChart2 className="w-4 h-4 mr-1" />
                      Statistics
                    </Link>
                    <button
                      onClick={() => deleteQuiz(quiz._id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quiz Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Questions
                  </th>
              
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuizzes.map(quiz => (
                  <tr key={quiz._id} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-md flex items-center justify-center text-blue-600">
                          <Clipboard className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{quiz.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{quiz.description || "No description"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mr-2">
                          <span className="text-sm font-semibold text-blue-800">{quiz.questionCount}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {quiz.questionCount === 1 ? 'question' : 'questions'}
                        </span>
                      </div>
                    </td>
              
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {quiz.lastUpdated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <Link
                          to={`/admin/quizzes/${quiz._id}/edit`}
                          className="text-blue-600 hover:text-blue-900 flex items-center hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                          title="Edit Quiz"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                        <Link
                          to={`/admin/quizzes/${quiz._id}/questions`}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                          title="Manage Questions"
                        >
                          <CircleHelp className="h-4 w-4 mr-1" />
                          Questions
                        </Link>
                        <Link
                          to={`/admin/quizzes/${quiz._id}/statistics`}
                          className="text-green-600 hover:text-green-900 flex items-center hover:bg-green-50 px-2 py-1 rounded transition-colors"
                          title="View Statistics"
                        >
                          <BarChart2 className="h-4 w-4 mr-1" />
                          Stats
                        </Link>
                        <button
                          onClick={() => deleteQuiz(quiz._id)}
                          className="text-red-600 hover:text-red-900 flex items-center hover:bg-red-50 px-2 py-1 rounded transition-colors"
                          title="Delete Quiz"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination (could be added if needed) */}
      {filteredQuizzes.length > 0 && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{filteredQuizzes.length}</span> {filteredQuizzes.length === 1 ? 'quiz' : 'quizzes'}
          </div>
          <div className="flex-1 flex justify-end">
            {/* Pagination controls would go here */}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageQuizzes;