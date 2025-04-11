import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import QuizCard from './QuizCard';
import { Search, Filter, Book, Star } from 'lucide-react';

const QuizList = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    search: ''
  });
  
  const categories = ['Programming', 'Science', 'Mathematics', 'History', 'Geography', 'General Knowledge'];
  const difficulties = ['easy', 'medium', 'hard'];
  
  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.search) params.append('search', filters.search);
      
      const response = await api.get(`/quizzes?${params}`);
      setQuizzes(response.data.quizzes);
      setError(null);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setError('Failed to load quizzes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchQuizzes();
  }, [filters]);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchQuizzes();
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Discover Quizzes</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Challenge yourself with our collection of interactive quizzes across various topics and difficulty levels.</p>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md mb-8 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">Filter Quizzes</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Category filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="relative">
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <Book className="h-4 w-4" />
                </div>
              </div>
            </div>
            
            {/* Difficulty filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <div className="relative">
                <select
                  name="difficulty"
                  value={filters.difficulty}
                  onChange={handleFilterChange}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="">All Difficulties</option>
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <Star className="h-4 w-4" />
                </div>
              </div>
            </div>
            
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search quizzes by title or topic..."
                  className="flex-grow p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center"
                >
                  <Search className="h-5 w-5" />
                  <span className="ml-2 hidden md:inline">Search</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Results count */}
      {!loading && !error && (
        <div className="mb-4 text-gray-600">
          Showing {quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'}
          {(filters.category || filters.difficulty || filters.search) && ' with current filters'}
        </div>
      )}
      
      {/* Quizzes */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading quizzes...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-red-50 rounded-lg p-6">
          <p className="text-red-600 text-lg">{error}</p>
          <button 
            onClick={fetchQuizzes} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg p-6">
          <p className="text-gray-600 text-lg">No quizzes found. Try adjusting your filters.</p>
          <button 
            onClick={() => setFilters({ category: '', difficulty: '', search: '' })} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {quizzes.map(quiz => (
            <QuizCard key={quiz._id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizList;