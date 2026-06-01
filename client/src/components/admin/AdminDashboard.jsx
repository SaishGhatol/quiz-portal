import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import {
  Loader, Users, BookOpen, Trophy, TrendingUp, Plus, ArrowRight,
  BarChart2, Download, Star, MessageSquare, Settings, Shield,
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats,    setStats]    = useState(null);
  const [pending,  setPending]  = useState(0);
  const [recent,   setRecent]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard/stats'),
      api.get('/reviews/all').catch(() => ({ data: [] })),
      api.get('/admin/quizzes/attempts/recent').catch(() => ({ data: { attempts: [] } })),
    ]).then(([statsRes, reviewsRes, attemptsRes]) => {
      setStats(statsRes.data);
      const reviews = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
      setPending(reviews.filter(r => !r.approved).length);
      const attempts = attemptsRes.data?.attempts || [];
      setRecent(attempts.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh] bg-white dark:bg-gray-950">
      <Loader className="animate-spin h-6 w-6 text-indigo-500" />
    </div>
  );

  const statCards = [
    { label: 'Total users',    value: stats?.totalUsers    ?? '—', icon: Users,      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Total quizzes',  value: stats?.totalQuizzes  ?? '—', icon: BookOpen,   color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Total attempts', value: stats?.totalAttempts ?? '—', icon: Trophy,     color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Active users',   value: stats?.activeUsers   ?? '—', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  ];

  const actions = [
    { label: 'Create quiz',     desc: 'Add a new quiz to the platform',      to: '/admin/quizzes/create', icon: Plus,         primary: true },
    { label: 'Analytics',       desc: 'Charts, trends & performance data',   to: '/admin/analytics',      icon: BarChart2 },
    { label: 'Reports',         desc: 'Export users & attempts as CSV',       to: '/admin/reports',        icon: Download },
    { label: 'Manage quizzes',  desc: 'Edit, publish, or delete quizzes',    to: '/admin/quizzes',        icon: BookOpen },
    { label: 'Manage users',    desc: 'View and edit user accounts',         to: '/admin/users',          icon: Users },
    {
      label: 'Manage reviews',
      desc: 'Approve or remove testimonials',
      to: '/admin/reviews',
      icon: Star,
      badge: pending > 0 ? pending : null,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Platform overview</p>
          </div>
          <Link
            to="/admin/quizzes/create"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" /> New quiz
          </Link>
        </div>

        {/* Pending reviews alert */}
        {pending > 0 && (
          <Link
            to="/admin/reviews"
            className="flex items-center gap-3 px-5 py-3.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
          >
            <Star className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
              {pending} review{pending > 1 ? 's' : ''} waiting for approval
            </p>
            <ArrowRight className="h-4 w-4 text-amber-500 ml-auto shrink-0" />
          </Link>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Quick actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {actions.map((a, i) => (
              <Link
                key={i}
                to={a.to}
                className={`relative flex items-center gap-3 p-4 rounded-xl border transition-colors group ${
                  a.primary
                    ? 'bg-indigo-600 border-indigo-600 hover:bg-indigo-700'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  a.primary
                    ? 'bg-indigo-500'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <a.icon className={`h-4 w-4 ${a.primary ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${a.primary ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{a.label}</p>
                  <p className={`text-xs mt-0.5 truncate ${a.primary ? 'text-indigo-200' : 'text-gray-400 dark:text-gray-500'}`}>{a.desc}</p>
                </div>
                {a.badge && (
                  <span className="absolute top-2 right-2 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-amber-500 text-white text-xs font-bold rounded-full">
                    {a.badge}
                  </span>
                )}
                {!a.badge && (
                  <ArrowRight className={`h-4 w-4 shrink-0 ${a.primary ? 'text-indigo-200' : 'text-gray-300 dark:text-gray-600'}`} />
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        {recent.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Recent activity</h2>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-5 py-3 font-medium">User</th>
                    <th className="text-right px-5 py-3 font-medium">Score</th>
                    <th className="text-right px-5 py-3 font-medium hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {recent.map((a, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{a.user?.name || 'Unknown'}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          a.score >= 60
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {a.score}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-400 hidden sm:table-cell">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
