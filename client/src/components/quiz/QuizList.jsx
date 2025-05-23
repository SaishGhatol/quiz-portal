import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import QuizCard from './QuizCard';
import { Search, Filter, Book, Star ,RotateCw, AlertCircle} from 'lucide-react';

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
  const difficulties = ['Easy', 'Medium', 'Hard'];
  
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12 text-center space-y-3">
          <h1 className="text-5xl font-bold text-gray-900 bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 inline-block">
            Knowledge Arena
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Test your skills with our curated collection of interactive quizzes. 
            <span className="block mt-1 text-sm text-gray-500">Updated daily • Expert verified • Community driven</span>
          </p>
        </div>
  
        {/* Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl mb-8 border border-gray-200/60">
          <div className="p-6 lg:p-8">
            <div className="flex items-center mb-6 gap-2 text-blue-600">
              <Filter className="h-6 w-6" strokeWidth={2} />
              <h2 className="text-2xl font-semibold">Refine Your Search</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Category</label>
                <div className="relative">
                  <select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="w-full pl-4 pr-10 py-3 border border-gray-300/80 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm transition-all"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Book className="h-5 w-5" />
                  </div>
                </div>
              </div>
  
              {/* Difficulty Filter */}
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Difficulty</label>
                <div className="relative">
                  <select
                    name="difficulty"
                    value={filters.difficulty}
                    onChange={handleFilterChange}
                    className="w-full pl-4 pr-10 py-3 border border-gray-300/80 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm transition-all"
                  >
                    <option value="">All Levels</option>
                    {difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Star className="h-5 w-5" />
                  </div>
                </div>
              </div>
  
              {/* Search Input */}
              <div className="md:col-span-2 relative group">
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Search</label>
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search quizzes..."
                    className="w-full pl-4 pr-14 py-3 border border-gray-300/80 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600/10 p-2 rounded-lg hover:bg-blue-600/20 transition-colors"
                  >
                    <Search className="h-5 w-5 text-blue-600" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
  
        {/* Results Header */}
        {!loading && !error && (
          <div className="mb-6 flex items-center justify-between px-2">
            <div className="text-gray-600 font-medium">
              <span className="text-blue-600">{quizzes.length}</span> results found
              {(filters.category || filters.difficulty || filters.search) && (
                <span className="ml-2 text-sm text-gray-500">(filtered)</span>
              )}
            </div>
            <button 
              onClick={() => setFilters({ category: '', difficulty: '', search: '' })}
              className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1"
            >
              <RotateCw className="h-4 w-4" />
              Reset filters
            </button>
          </div>
        )}
  
        {/* Content States */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-white/80 rounded-2xl shadow-sm animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-gradient-to-br from-red-50/50 to-pink-50/50 rounded-2xl border border-red-100">
            <div className="mx-auto max-w-md">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button 
                onClick={fetchQuizzes} 
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center gap-2 mx-auto"
              >
                <RotateCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-2xl border border-blue-100">
            <div className="mx-auto max-w-md">
              <Book className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No quizzes found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
              <button 
                onClick={() => setFilters({ category: '', difficulty: '', search: '' })} 
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 mx-auto"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map(quiz => (
              <QuizCard key={quiz._id} quiz={quiz} />
            ))}
          </div>
        )}
      </div>
    );
  };
  
  export default QuizList;