import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import AuthContext from '../../contexts/AuthContext';
import { Loader, ArrowRight, Trophy, BookOpen, TrendingUp, Clock, CheckCircle, AlertCircle, Calendar, Layers, Bell } from 'lucide-react';

/* Tiny SVG sparkline — no extra dependency */
const MiniSparkline = ({ values }) => {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${40 - (v / max) * 40}`);
  return (
    <svg viewBox="0 0 100 40" className="w-20 h-8" preserveAspectRatio="none">
      <polyline points={pts.join(' ')} fill="none" stroke="#4f46e5" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const Dashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [attempts,      setAttempts]      = useState([]);
  const [totalQuizzes,  setTotalQuizzes]  = useState(0);
  const [assignments,   setAssignments]   = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/quizzes/my-attempts').catch(() => ({ data: { attempts: [] } })),
      api.get('/quizzes/stats').catch(() => ({ data: { totalQuizzes: 0 } })),
      api.get('/org/my-assignments').catch(() => ({ data: { assignments: [] } })),
      api.get('/org/announcements').catch(() => ({ data: { announcements: [] } })),
    ]).then(([a, s, asgn, ann]) => {
      setAttempts(a.data.attempts || []);
      setTotalQuizzes(s.data.totalQuizzes || 0);
      // Only show active (not expired, not future)
      setAssignments((asgn.data.assignments || []).filter(x => {
        if (x.dueDate && new Date(x.dueDate) < new Date()) return false;
        if (x.startDate && new Date(x.startDate) > new Date()) return false;
        return true;
      }));
      setAnnouncements(ann.data.announcements || []);
    }).finally(() => setLoading(false));
  }, []);

  const done = attempts.filter(a => a.completedAt);
  const pct  = a => a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : 0;
  const avg  = done.length ? Math.round(done.reduce((s, a) => s + pct(a), 0) / done.length) : 0;
  const recentScores = done.slice(-8).map(pct);

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh] bg-white dark:bg-gray-950">
      <Loader className="animate-spin h-6 w-6 text-indigo-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-7">

        {/* Greeting */}
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{greeting}</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{currentUser?.name}</h1>
        </div>

        {/* Announcement banner */}
        {announcements.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {announcements[0].isPinned ? '📌 ' : ''}{announcements[0].title}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5 line-clamp-2">{announcements[0].content}</p>
              </div>
              {announcements.length > 1 && (
                <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0 self-center">+{announcements.length - 1}</span>
              )}
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Quizzes done', value: done.length,        icon: Trophy },
            { label: 'Avg score',   value: `${avg}%`,           icon: TrendingUp },
            { label: 'Available',   value: totalQuizzes,        icon: BookOpen },
            { label: 'Assigned',    value: assignments.length,  icon: Layers },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <s.icon className="h-5 w-5 text-indigo-500 mb-3" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Score sparkline */}
        {recentScores.length >= 2 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Score trend</p>
              <p className="text-xs text-gray-400 mt-0.5">Last {recentScores.length} quizzes</p>
            </div>
            <MiniSparkline values={recentScores} />
            <Link to="/progress" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline shrink-0">
              Full report →
            </Link>
          </div>
        )}

        {/* Pending assignments */}
        {assignments.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-500" /> Assigned to you
              </h2>
              <Link to="/my-assignments" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {assignments.slice(0, 3).map((a, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  {a.batch?.color && <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: a.batch.color }} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.quiz?.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                      {a.batch?.name}
                      {a.dueDate && <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" />Due {new Date(a.dueDate).toLocaleDateString()}</span>}
                    </p>
                  </div>
                  <Link to={`/quiz/${a.quiz?._id}`}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
                    Start <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-indigo-600 rounded-xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-white">Ready for a challenge?</p>
            <p className="text-sm text-indigo-100 mt-0.5">Browse all available quizzes.</p>
          </div>
          <Link to="/quizzes" className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-50 transition-colors">
            Explore <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Recent activity */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-bold text-gray-900 dark:text-white">Recent activity</h2>
            <Link to="/my-attempts" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">View all</Link>
          </div>
          {done.length === 0 ? (
            <div className="py-14 text-center">
              <BookOpen className="h-8 w-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No quizzes completed yet.</p>
              <Link to="/quizzes" className="mt-3 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Start one now</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {done.slice(0, 5).map((a, i) => {
                const score = pct(a);
                return (
                  <Link key={i} to={`/attempts/${a._id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    {score >= 70
                      ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      : <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.quiz?.title || 'Unknown'}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> {new Date(a.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${score >= 70 ? 'text-green-600 dark:text-green-400' : score >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                      {score}%
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 transition-colors" />
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

export default Dashboard;
