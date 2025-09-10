import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import {
  Edit, BarChart2, Trash2, PlusCircle, HelpCircle, AlertTriangle, Search, ChevronDown, Clock, MoreVertical, Loader, ArrowLeft
} from 'lucide-react';

// Custom Hook for detecting when an element is in view
const useIntersectionObserver = (options) => {
  const [entry, setEntry] = useState(null);
  const [node, setNode] = useState(null);
  const observer = useRef(null);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();
    observer.current = new window.IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setEntry(entry);
    }, options);
    const { current: currentObserver } = observer;
    if (node) currentObserver.observe(node);
    return () => currentObserver.disconnect();
  }, [node, options]);

  return [setNode, entry];
};

const ManageQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  const [filterDropdown, setFilterDropdown] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const dropdownRef = useRef(null);
  const [setGridRef, gridEntry] = useIntersectionObserver({ threshold: 0.05 });

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/quizzes');
      const quizzesWithData = await Promise.all(
        response.data.quizzes.map(async (quiz) => {
          try {
            const questionsRes = await api.get(`/quizzes/${quiz._id}/questions`);
            return { ...quiz, questionCount: questionsRes.data.questions.length };
          } catch (err) {
            return { ...quiz, questionCount: 0 };
          }
        })
      );
      setQuizzes(quizzesWithData);
      setError(null);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Failed to load quizzes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setFilterDropdown(null);
        setActionMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const deleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to permanently delete this quiz and all its data?')) return;
    try {
      await api.delete(`/quizzes/${quizId}`);
      toast.success('Quiz deleted successfully', { theme: 'dark' });
      setQuizzes(quizzes.filter(quiz => quiz._id !== quizId));
      setActionMenu(null);
    } catch (err) {
      toast.error('Failed to delete quiz', { theme: 'dark' });
    }
  };

  const filteredAndSortedQuizzes = quizzes
    .filter(quiz => {
      if (searchTerm && !quiz.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterStatus === 'published' && !quiz.isPublished) return false;
      if (filterStatus === 'draft' && quiz.isPublished) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title': return a.title.localeCompare(b.title);
        case 'questions': return b.questionCount - a.questionCount;
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader className="animate-spin h-8 w-8 text-gray-500"/></div>;
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-500/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Quizzes</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={fetchQuizzes} className="px-5 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors">Try Again</button>
        </div>
      </div>
    );
  }
  
  const QuizCard = ({ quiz, index }) => {
    const cardRef = useRef(null);
    const handleMouseMove = (e) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      cardRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      cardRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    };

    return (
      <div ref={cardRef} onMouseMove={handleMouseMove} style={{ transitionDelay: `${index * 50}ms` }} className={`group relative bg-gray-950 border border-gray-800 rounded-2xl p-5 overflow-hidden flex flex-col transition-all duration-500 opacity-0 translate-y-5 ${gridEntry?.isIntersecting ? 'opacity-100 translate-y-0' : ''}`}>
        <div className="absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 before:absolute before:inset-0 before:rounded-xl before:bg-[radial-gradient(350px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(148,163,184,0.1),transparent_80%)] pointer-events-none" />
        <div className="relative z-10 flex-grow">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-white pr-8">{quiz.title}</h3>
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${quiz.isPublished ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${quiz.isPublished ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              {quiz.isPublished ? 'Published' : 'Draft'}
            </div>
          </div>
          <p className="text-sm text-gray-400 line-clamp-2">{quiz.description || "No description provided."}</p>
        </div>
        <div className="relative z-10 border-t border-gray-800 mt-4 pt-4 flex justify-between items-center text-sm">
          <div className="flex items-center gap-4 text-gray-400">
            <span className="flex items-center gap-1.5"><HelpCircle size={14}/> {quiz.questionCount}</span>
            <span className="flex items-center gap-1.5"><Clock size={14}/> {new Date(quiz.updatedAt).toLocaleDateString()}</span>
          </div>
          <div className="relative" ref={actionMenu === quiz._id ? dropdownRef : null}>
            <button onClick={() => setActionMenu(actionMenu === quiz._id ? null : quiz._id)} className="p-1.5 rounded-md hover:bg-gray-800 text-gray-500 hover:text-white">
              <MoreVertical size={16} />
            </button>
            {actionMenu === quiz._id && (
              <div className="absolute right-0 bottom-full mb-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20">
                <Link to={`/admin/quizzes/${quiz._id}/edit`} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-t-lg"><Edit size={14} /> Edit</Link>
                <Link to={`/admin/quizzes/${quiz._id}/questions`} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"><HelpCircle size={14} /> Questions</Link>
                <Link to={`/admin/quizzes/${quiz._id}/statistics`} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"><BarChart2 size={14} /> Stats</Link>
                <button onClick={() => deleteQuiz(quiz._id)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-800 rounded-b-lg"><Trash2 size={14} /> Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <style>{`
        @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">Manage Quizzes</h1>
          <p className="text-gray-400 mt-1">Create, edit, and oversee all quizzes on the platform.</p>
        </div>
        <div className="flex items-center gap-3">
            <Link to="/admin" className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                Dashboard
            </Link>
            <Link to="/admin/quizzes/create" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
                <PlusCircle size={16} /> Create Quiz
            </Link>
        </div>
      </header>

      {/* Control Bar */}
      <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 mb-6 flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:w-auto flex-grow">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Search by title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"/>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto" ref={dropdownRef}>
          <div className="relative">
            <button onClick={() => setFilterDropdown(filterDropdown === 'status' ? null : 'status')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800">
              Status: <span className="font-semibold text-white capitalize">{filterStatus}</span> <ChevronDown size={16} />
            </button>
            {filterDropdown === 'status' && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-10">
                <button onClick={() => { setFilterStatus('all'); setFilterDropdown(null); }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">All</button>
                <button onClick={() => { setFilterStatus('published'); setFilterDropdown(null); }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">Published</button>
                <button onClick={() => { setFilterStatus('draft'); setFilterDropdown(null); }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">Draft</button>
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setFilterDropdown(filterDropdown === 'sort' ? null : 'sort')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800">
              Sort by: <span className="font-semibold text-white capitalize">{sortBy}</span> <ChevronDown size={16} />
            </button>
            {filterDropdown === 'sort' && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-10">
                <button onClick={() => { setSortBy('newest'); setFilterDropdown(null); }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">Newest</button>
                <button onClick={() => { setSortBy('oldest'); setFilterDropdown(null); }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">Oldest</button>
                <button onClick={() => { setSortBy('title'); setFilterDropdown(null); }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">Title</button>
                <button onClick={() => { setSortBy('questions'); setFilterDropdown(null); }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">Questions</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      {quizzes.length === 0 ? (
        <div className="text-center py-20 bg-gray-950 border border-gray-800 rounded-2xl">
          <HelpCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Quizzes Created Yet</h3>
          <p className="text-gray-500 mb-6">Start by creating your first quiz.</p>
          <Link to="/admin/quizzes/create" className="inline-flex items-center gap-2 px-5 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors">
            Create First Quiz
          </Link>
        </div>
      ) : filteredAndSortedQuizzes.length === 0 ? (
        <div className="text-center py-20 bg-gray-950 border border-gray-800 rounded-2xl">
          <Search size={12} className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Matching Quizzes</h3>
          <p className="text-gray-500">Your search and filters returned no results.</p>
        </div>
      ) : (
        <div ref={setGridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedQuizzes.map((quiz, index) => <QuizCard key={quiz._id} quiz={quiz} index={index} />)}
        </div>
      )}
    </div>
  );
};

export default ManageQuizzes;

