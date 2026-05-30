import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Loader, Trophy, Clock, Search, ArrowRight, CheckCircle, XCircle, ChevronUp, ChevronDown, X } from 'lucide-react';

const UserAttempts = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [sortBy,   setSortBy]   = useState('date');
  const [asc,      setAsc]      = useState(false);

  useEffect(() => {
    api.get('/quizzes/my-attempts')
      .then(r => setAttempts(r.data.attempts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sort = key => { if (sortBy === key) setAsc(a => !a); else { setSortBy(key); setAsc(false); } };

  const pct = a => a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : 0;

  const rows = attempts
    .filter(a => a.completedAt)
    .filter(a => !search || (a.quiz?.title || '').toLowerCase().includes(search.toLowerCase()) || (a.quiz?.category || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let d = sortBy === 'date'  ? new Date(b.completedAt) - new Date(a.completedAt)
            : sortBy === 'score' ? pct(b) - pct(a)
            : (a.quiz?.title || '').localeCompare(b.quiz?.title || '');
      return asc ? -d : d;
    });

  const avg  = rows.length ? Math.round(rows.reduce((s, a) => s + pct(a), 0) / rows.length) : 0;
  const pass = rows.length ? Math.round(rows.filter(a => pct(a) >= 40).length / rows.length * 100) : 0;

  const ColBtn = ({ field, label }) => (
    <button onClick={() => sort(field)} className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wider ${sortBy === field ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
      {label}{sortBy === field ? (asc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
    </button>
  );

  if (loading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader className="animate-spin h-6 w-6 text-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Attempts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{rows.length} completed</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Completed', value: rows.length },
            { label: 'Avg score', value: `${avg}%` },
            { label: 'Pass rate', value: `${pass}%` },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4">
              <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-3 items-center px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                className="w-full pl-8 pr-8 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="h-3 w-3" /></button>}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400 ml-auto">
              Sort: <ColBtn field="date" label="Date" /> <ColBtn field="score" label="Score" /> <ColBtn field="title" label="Title" />
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="py-16 text-center">
              <Trophy className="h-8 w-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No attempts found.</p>
              <Link to="/quizzes" className="mt-2 inline-block text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Take a quiz</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {rows.map((a, i) => {
                const score = pct(a);
                return (
                  <Link key={i} to={`/attempts/${a._id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    {score >= 40
                      ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      : <XCircle    className="h-4 w-4 text-red-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.quiz?.title || 'Unknown Quiz'}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> {new Date(a.completedAt).toLocaleDateString()}
                        {a.quiz?.category && <span>· {a.quiz.category}</span>}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${score >= 70 ? 'text-green-600 dark:text-green-400' : score >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                      {score}%
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAttempts;
