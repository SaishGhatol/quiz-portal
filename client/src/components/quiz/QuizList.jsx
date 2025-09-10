// client/quiz/QuizList.jsx
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import QuizCard from './QuizCard';
import { Search, Filter, Book, RotateCw, AlertCircle, Sparkles, Target, TrendingUp } from 'lucide-react';

// --- ENHANCEMENT: Moved constants outside the component to prevent re-declaration on each render.
const CATEGORIES = ['Programming', 'Science', 'Mathematics', 'History', 'Geography', 'General Knowledge'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const QuizList = () => {
  const [quizzes, setQuizzes] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [isFilterExpanded, setIsFilterExpanded] = React.useState(false);
  
  // --- ENHANCEMENT: useSearchParams makes the URL the single source of truth for filters.
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read filter values directly from the URL search parameters.
  const filters = {
    category: searchParams.get('category') || '',
    difficulty: searchParams.get('difficulty') || '',
    search: searchParams.get('search') || ''
  };

  // Check if any filters are active
  const hasActiveFilters = filters.category || filters.difficulty || filters.search;

  // The data fetching logic remains robust.
  const fetchQuizzes = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // The params are now built directly from the URL's searchParams object.
      const response = await api.get(`/quizzes?${searchParams}`);
      setQuizzes(response.data.quizzes);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Failed to load quizzes. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [searchParams]); // Re-run fetchQuizzes whenever searchParams change.
  
  // Debounced effect for fetching data based on URL changes.
  React.useEffect(() => {
    const handler = setTimeout(() => {
      fetchQuizzes();
    }, 500); // Fetch 500ms after the last filter change.

    return () => {
      clearTimeout(handler);
    };
  }, [fetchQuizzes]);

  // --- ENHANCEMENT: Filter changes now update the URL parameters.
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(name, value);
    } else {
      newParams.delete(name); // Remove param from URL if the value is empty
    }
    setSearchParams(newParams);
  };

  // --- ENHANCEMENT: Resetting now clears the URL parameters.
  const resetFilters = () => {
    setSearchParams({});
  };

  const handleRandomizeQuiz = () => {
    if (quizzes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * quizzes.length);
    navigate(`/quiz/${quizzes[randomIndex]._id}/take`);
  };

  return (
    <div className="bg-black text-gray-300 min-h-screen relative overflow-hidden">
      {/* Ambient background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-transparent to-gray-800/10 pointer-events-none"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gray-800/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-700/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Hero Section with enhanced styling */}
        <div className="mb-16 text-center relative">
          <div className="inline-flex items-center gap-2 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-full px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400 font-medium">Knowledge Testing Platform</span>
          </div>
          
          <h1 className="text-6xl sm:text-7xl font-bold text-white mb-6 tracking-tight">
            Knowledge
            <span className="block bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Arena
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Challenge your intellect with our curated collection of quizzes. Test your knowledge across various domains and track your progress.
          </p>
          
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-12">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{quizzes.length}</div>
              <div className="text-sm text-gray-500">Available Quizzes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{CATEGORIES.length}</div>
              <div className="text-sm text-gray-500">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{DIFFICULTIES.length}</div>
              <div className="text-sm text-gray-500">Difficulty Levels</div>
            </div>
          </div>
        </div>

        {/* Enhanced Filter Section */}
        <div className="bg-gray-950/60 backdrop-blur-sm border border-gray-800/50 rounded-2xl mb-10 overflow-hidden">
          {/* Filter Header */}
          <div className="p-6 border-b border-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-800/50 rounded-lg">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Filter Quizzes</h2>
                  <p className="text-sm text-gray-500">Narrow down your search</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <div className="flex items-center gap-2 bg-gray-800/50 rounded-full px-3 py-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-400">Filters Active</span>
                  </div>
                )}
                
                <button
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  className="lg:hidden p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <Filter className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className={`p-6 transition-all duration-300 ${isFilterExpanded ? 'block' : 'hidden lg:block'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category */}
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                <select 
                  name="category" 
                  value={filters.category} 
                  onChange={handleFilterChange} 
                  className="w-full py-3 px-4 bg-gray-900/80 border border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-700 focus:border-gray-600 transition-all duration-200 hover:bg-gray-900 appearance-none cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* Difficulty */}
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-400 mb-2">Difficulty</label>
                <select 
                  name="difficulty" 
                  value={filters.difficulty} 
                  onChange={handleFilterChange} 
                  className="w-full py-3 px-4 bg-gray-900/80 border border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-700 focus:border-gray-600 transition-all duration-200 hover:bg-gray-900 appearance-none cursor-pointer"
                >
                  <option value="">All Difficulties</option>
                  {DIFFICULTIES.map(diff => <option key={diff} value={diff}>{diff}</option>)}
                </select>
              </div>

              {/* Search */}
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-400 mb-2">Search</label>
                <div className="relative">
                  <input 
                    type="text" 
                    name="search" 
                    value={filters.search} 
                    onChange={handleFilterChange} 
                    placeholder="Search quizzes..." 
                    className="w-full pl-12 pr-4 py-3 bg-gray-900/80 border border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-700 focus:border-gray-600 transition-all duration-200 hover:bg-gray-900 placeholder-gray-600"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600 group-focus-within:text-gray-400 transition-colors" />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Actions</label>
                <button 
                  onClick={handleRandomizeQuiz}
                  disabled={loading || quizzes.length === 0}
                  className="w-full bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border border-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <RotateCw className="h-5 w-5" />
                  Random Quiz
                </button>
              </div>
            </div>
            
            {/* Reset button when filters are active */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-gray-800/50">
                <button 
                  onClick={resetFilters} 
                  className="text-sm text-gray-500 hover:text-white flex items-center gap-2 transition-colors group"
                >
                  <RotateCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Results Header */}
        {!loading && !error && (
          <div className="mb-8 flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="text-gray-400 flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="font-semibold text-white text-lg">{quizzes.length}</span> 
                <span className="text-gray-500">quizzes found</span>
              </div>
              
              {hasActiveFilters && (
                <div className="flex items-center gap-2 bg-gray-900/50 rounded-full px-3 py-1">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-gray-400">Filtered results</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Content Area */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="h-[24rem] bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl animate-pulse border border-gray-800/30"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-24 bg-gradient-to-br from-gray-950/80 to-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl">
            <div className="p-4 bg-red-500/10 rounded-full w-fit mx-auto mb-6">
              <AlertCircle className="h-12 w-12 text-red-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">Could Not Load Quizzes</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">{error}</p>
            <button 
              onClick={fetchQuizzes} 
              className="px-8 py-3 bg-white text-black rounded-xl hover:bg-gray-200 font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              Try Again
            </button>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-24 bg-gradient-to-br from-gray-950/80 to-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl">
            <div className="p-4 bg-gray-800/30 rounded-full w-fit mx-auto mb-6">
              <Book className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">No Quizzes Found</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
              {hasActiveFilters 
                ? "Your search or filter criteria returned no results. Try adjusting your filters."
                : "No quizzes are currently available."
              }
            </p>
            {hasActiveFilters && (
              <button 
                onClick={resetFilters} 
                className="px-8 py-3 bg-white text-black rounded-xl hover:bg-gray-200 font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {quizzes.map((quiz, index) => (
              <div
                key={quiz._id}
                className="transform transition-all duration-300 hover:scale-[1.02]"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <QuizCard quiz={quiz} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizList;