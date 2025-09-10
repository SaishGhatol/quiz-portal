import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { 
  BarChart2, Trophy, Clock,
  BookOpen, CheckCircle, FileSpreadsheet,
  PlusCircle, Search, ChevronDown, Loader, AlertTriangle
} from 'lucide-react';

// A reusable, interactive card with the mouse-tracking aurora effect
const Card = ({ children, className = '', style }) => {
  const cardRef = useRef(null);
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      style={style}
      className={`group relative bg-gray-950 border border-gray-800 rounded-2xl p-6 overflow-hidden ${className}`}
    >
      <div
        className="absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 
                   before:absolute before:inset-0 before:rounded-xl 
                   before:bg-[radial-gradient(400px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(148,163,184,0.1),transparent_80%)] 
                   pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative z-10 h-full flex flex-col">{children}</div>
    </div>
  );
};


const UserAttempts = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  useEffect(() => {
    const fetchAttempts = async () => {
      setLoading(true);
      try {
        const response = await api.get('/attempts/user');
        setAttempts(response.data.attempts || []);
        setError(null);
      } catch (err) {        
        setError(`Failed to load your quiz attempts. ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchAttempts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const filteredAndSortedAttempts = useMemo(() => {
    return attempts
      .filter(attempt => {
        const quizTitle = attempt.quiz?.title?.toLowerCase() || '';
        const category = attempt.quiz?.category?.toLowerCase() || '';
        return quizTitle.includes(searchTerm.toLowerCase()) || category.includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => {
        let compareA, compareB;
        switch (filters.sortBy) {
          case 'score':
            compareA = a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0;
            compareB = b.maxScore > 0 ? (b.score / b.maxScore) * 100 : 0;
            break;
          case 'quiz.title':
            compareA = a.quiz?.title || '';
            compareB = b.quiz?.title || '';
            return filters.sortOrder === 'asc' ? compareA.localeCompare(compareB) : compareB.localeCompare(compareA);
          default: // createdAt
            compareA = new Date(a.createdAt);
            compareB = new Date(b.createdAt);
        }
        return filters.sortOrder === 'asc' ? compareA - compareB : compareB - compareA;
      });
  }, [attempts, searchTerm, filters]);
  
  const stats = useMemo(() => {
    const completed = attempts.filter(a => a.completedAt);
    const avgScore = completed.length > 0
      ? Math.round(completed.reduce((sum, a) => sum + (a.score / a.maxScore * 100), 0) / completed.length)
      : 0;
    return { total: attempts.length, completed: completed.length, avgScore };
  }, [attempts]);

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader className="animate-spin h-8 w-8 text-gray-500"/></div>;
  }
  
  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-500/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Attempts</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-5 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors">Try Again</button>
        </div>
      </div>
    );
  }

  const statCards = [
      { icon: <FileSpreadsheet size={18} />, title: "Total Attempts", value: stats.total },
      { icon: <CheckCircle size={18} />, title: "Completed", value: stats.completed },
      { icon: <Trophy size={18} />, title: "Average Score", value: `${stats.avgScore}%` }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <header className="animate-slide-in-up" style={{ animationDelay: '100ms' }}>
        <h1 className="text-4xl font-bold text-white">My Attempts</h1>
        <p className="text-gray-400 mt-1">Review your quiz history and performance.</p>
      </header>
      
      {/* Stats Overview */}
      {attempts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((card, index) => (
              <Card key={index} className="animate-slide-in-up" style={{ animationDelay: `${200 + index * 100}ms` }}>
                  <div className="flex items-center text-gray-400 gap-3">{card.icon}<h3 className="font-semibold text-sm">{card.title}</h3></div>
                  <p className="text-5xl font-bold text-white mt-2">{card.value}</p>
              </Card>
          ))}
        </div>
      )}
      
      {/* Control Bar & Table */}
      <div className="bg-gray-950 border border-gray-800 rounded-2xl animate-slide-in-up" style={{ animationDelay: '500ms' }}>
        <div className="p-4 flex flex-col md:flex-row items-center gap-4 border-b border-gray-800">
          <div className="relative w-full md:w-auto flex-grow">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search attempts..." className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"/>
          </div>
          <div className="relative" ref={sortRef}>
            <button onClick={() => setIsSortOpen(!isSortOpen)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800 w-full justify-between md:w-auto">
              Sort by: <span className="font-semibold text-white capitalize">{filters.sortBy.replace('quiz.title', 'Title')}</span> 
              <ChevronDown size={16} className={`transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-10 overflow-hidden transition-all duration-300 ${isSortOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <button onClick={() => { setFilters(f => ({...f, sortBy: 'createdAt'})); setIsSortOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">Date</button>
                <button onClick={() => { setFilters(f => ({...f, sortBy: 'score'})); setIsSortOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">Score</button>
                <button onClick={() => { setFilters(f => ({...f, sortBy: 'quiz.title'})); setIsSortOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">Quiz Title</button>
                <div className="border-t border-gray-700 my-1"></div>
                <button onClick={() => { setFilters(f => ({...f, sortOrder: 'desc'})); setIsSortOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">Descending</button>
                <button onClick={() => { setFilters(f => ({...f, sortOrder: 'asc'})); setIsSortOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">Ascending</button>
            </div>
          </div>
        </div>
        
        {/* Attempts List */}
        {attempts.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Attempts Yet</h3>
            <p className="text-gray-500 mb-6">You haven't taken any quizzes. Start one to see your progress!</p>
            <Link to="/quizzes" className="inline-flex items-center gap-2 px-5 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors">
              <PlusCircle size={16}/> Browse Quizzes
            </Link>
          </div>
        ) : filteredAndSortedAttempts.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-900"><tr className="border-b border-gray-800"><th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Quiz</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Date</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Score</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th><th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase"></th></tr></thead>
                    <tbody className="divide-y divide-gray-800">
                    {filteredAndSortedAttempts.map((attempt, index) => (
                        <tr key={attempt._id} className="hover:bg-gray-900 transition-colors animate-fade-in" style={{ animationDelay: `${index * 50}ms`}}>
                        <td className="px-5 py-4 whitespace-nowrap"><div className="font-medium text-white">{attempt.quiz?.title || 'Untitled Quiz'}</div><div className="text-xs text-gray-500">{attempt.quiz?.category || 'General'}</div></td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-400">{formatDate(attempt.createdAt)}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm"><span className={`px-2 py-1 font-semibold rounded-full text-xs ${attempt.maxScore > 0 ? (attempt.score/attempt.maxScore*100 >= 60 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400') : 'bg-gray-500/10 text-gray-400'}`}>{attempt.maxScore > 0 ? `${Math.round(attempt.score/attempt.maxScore*100)}%` : 'N/A'}</span></td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm">{attempt.completedAt ? (<div className="inline-flex items-center gap-1.5 text-green-400"><CheckCircle size={14}/> Completed</div>) : (<div className="inline-flex items-center gap-1.5 text-yellow-400"><Clock size={14}/> In Progress</div>)}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-right"><Link to={`/attempts/${attempt._id}`} className="font-semibold text-gray-300 hover:text-white">View Details</Link></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="text-center py-20"><p className="text-gray-500">No attempts match your search criteria.</p></div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-in-up { animation: slideInUp 0.6s ease-out forwards; opacity: 0; animation-fill-mode: forwards; }
      `}</style>
    </div>
  );
};

export default UserAttempts;

