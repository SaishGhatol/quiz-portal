import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Loader, TrendingUp, Trophy, Clock, Target, ArrowRight, BarChart2, BookOpen } from 'lucide-react';

/* Simple SVG sparkline (no Chart.js dependency needed) */
const Sparkline = ({ values, color = '#4f46e5', height = 48 }) => {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 200;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 200 ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Fill area */}
      <polygon
        points={`0,${height} ${pts.join(' ')} 200,${height}`}
        fill={color} fillOpacity="0.08" />
    </svg>
  );
};

const StudentProgress = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/quizzes/my-attempts')
      .then(r => setAttempts(r.data.attempts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const done = attempts.filter(a => a.completedAt).sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

  const pct  = a => a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : 0;
  const scores = done.map(pct);
  const avg  = scores.length ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : 0;
  const best = scores.length ? Math.max(...scores) : 0;
  const pass = done.filter(a => pct(a) >= 40).length;

  // Attempts per category
  const byCategory = done.reduce((acc, a) => {
    const cat = a.quiz?.category || 'Uncategorised';
    acc[cat] = acc[cat] || { name: cat, count: 0, totalPct: 0 };
    acc[cat].count++;
    acc[cat].totalPct += pct(a);
    return acc;
  }, {});

  const categories = Object.values(byCategory)
    .map(c => ({ ...c, avg: Math.round(c.totalPct / c.count) }))
    .sort((a, b) => b.count - a.count);

  if (loading) return <div className="flex justify-center items-center min-h-[50vh] bg-white dark:bg-gray-950"><Loader className="animate-spin h-6 w-6 text-indigo-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Progress</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Your quiz performance over time.</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Quizzes done', value: done.length,          icon: BookOpen },
            { label: 'Avg score',    value: `${avg}%`,            icon: BarChart2 },
            { label: 'Best score',   value: `${best}%`,           icon: Trophy },
            { label: 'Passed',       value: `${pass}/${done.length}`, icon: Target },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <s.icon className="h-5 w-5 text-indigo-500 mb-3" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Score trend */}
        {scores.length >= 2 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 dark:text-white">Score trend</h2>
              <span className="text-xs text-gray-400">{scores.length} attempts</span>
            </div>
            <Sparkline values={scores} color="#4f46e5" height={60} />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{new Date(done[0]?.completedAt).toLocaleDateString()}</span>
              <span>{new Date(done[done.length-1]?.completedAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Category breakdown */}
          {categories.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">By category</h2>
              <div className="space-y-3">
                {categories.map(c => (
                  <div key={c.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{c.name}</span>
                      <span className="text-gray-400 dark:text-gray-500 shrink-0 ml-2">{c.count} quiz{c.count !== 1 ? 'zes' : ''} · {c.avg}% avg</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${Math.min(c.avg, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent quiz results */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white">Recent results</h2>
              <Link to="/my-attempts" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">See all</Link>
            </div>
            {done.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">No completed quizzes yet.</div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {[...done].reverse().slice(0, 6).map((a, i) => {
                  const score = pct(a);
                  return (
                    <Link key={i} to={`/attempts/${a._id}`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                        ${score >= 70 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : score >= 40 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                        {score}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.quiz?.title || 'Quiz'}</p>
                        <p className="text-xs text-gray-400">{new Date(a.completedAt).toLocaleDateString()}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {done.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="font-medium text-gray-700 dark:text-gray-300">Start taking quizzes to see your progress</p>
            <Link to="/quizzes" className="mt-3 inline-block px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
              Browse quizzes
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProgress;
