import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import QuizCard from './QuizCard';
import { Search, SlidersHorizontal, BookOpen, Shuffle, AlertCircle, Loader, X, ChevronDown } from 'lucide-react';

const CATEGORIES  = ['Programming', 'Science', 'Mathematics', 'History', 'Geography', 'General Knowledge'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

const QuizList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [quizzes,     setQuizzes]     = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const q    = searchParams.get('search')     || '';
  const cat  = searchParams.get('category')   || '';
  const diff = searchParams.get('difficulty') || '';

  const set = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    setSearchParams(next);
  };

  const hasFilters = !!(q || cat || diff);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (q)    params.set('search', q);
      if (cat)  params.set('category', cat);
      if (diff) params.set('difficulty', diff);
      const res = await api.get(`/quizzes?${params}`);
      setQuizzes(res.data.quizzes || []);
      setTotal(res.data.total ?? (res.data.quizzes?.length || 0));
    } catch { setError('Could not load quizzes.'); }
    finally   { setLoading(false); }
  }, [q, cat, diff]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const randomQuiz = () => {
    if (quizzes.length) navigate(`/quiz/${quizzes[Math.floor(Math.random() * quizzes.length)]._id}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* ── Header bar ── */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Explore Quizzes</h1>
              {!loading && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} quiz{total !== 1 ? 'zes' : ''} available</p>
              )}
            </div>
            <button
              onClick={randomQuiz}
              disabled={loading || !quizzes.length}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              <Shuffle className="h-4 w-4" /> Random quiz
            </button>
          </div>

          {/* Search + filter toggle */}
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search quizzes…"
                value={q}
                onChange={e => set('search', e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {q && (
                <button onClick={() => set('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(s => !s)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors
                ${(cat || diff)
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {(cat || diff) && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-0.5" />}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            {hasFilters && (
              <button onClick={() => setSearchParams({})} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Clear
              </button>
            )}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl space-y-4 animate-fade-up">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => set('category', cat === c ? '' : c)}
                      className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors
                        ${cat === c
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Difficulty</p>
                <div className="flex gap-2">
                  {DIFFICULTIES.map(d => (
                    <button key={d} onClick={() => set('difficulty', diff === d ? '' : d)}
                      className={`px-3 py-1 text-xs font-medium rounded-md border capitalize transition-colors
                        ${diff === d
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
            <Loader className="animate-spin h-6 w-6 text-blue-500" />
            <p className="text-sm">Loading quizzes…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
            <button onClick={load} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              Try again
            </button>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <BookOpen className="h-10 w-10 text-gray-300 dark:text-gray-700" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">No quizzes found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filters.</p>
            {hasFilters && (
              <button onClick={() => setSearchParams({})} className="mt-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {quizzes.map(quiz => <QuizCard key={quiz._id} quiz={quiz} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizList;
