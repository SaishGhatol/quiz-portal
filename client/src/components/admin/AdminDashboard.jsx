import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Loader, Users, BookOpen, Trophy, Plus, ArrowRight, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh] bg-white dark:bg-gray-950">
      <Loader className="animate-spin h-6 w-6 text-blue-500" />
    </div>
  );

  const statCards = [
    { label: 'Total users',    value: stats?.totalUsers    ?? '—', icon: Users },
    { label: 'Total quizzes',  value: stats?.totalQuizzes  ?? '—', icon: BookOpen },
    { label: 'Total attempts', value: stats?.totalAttempts ?? '—', icon: Trophy },
    { label: 'Active users',   value: stats?.activeUsers   ?? '—', icon: TrendingUp },
  ];

  const actions = [
    { label: 'Create quiz',     desc: 'Add a new quiz',            to: '/admin/quizzes/create', primary: true },
    { label: 'Manage quizzes',  desc: 'Edit, publish, or delete',  to: '/admin/quizzes' },
    { label: 'Manage users',    desc: 'View and edit user accounts',to: '/admin/users' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Platform overview</p>
          </div>
          <Link to="/admin/quizzes/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus className="h-4 w-4" /> New quiz
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <s.icon className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-3" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Quick actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {actions.map((a, i) => (
              <Link key={i} to={a.to}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-colors group
                  ${a.primary
                    ? 'bg-blue-600 border-blue-600 hover:bg-blue-700'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}>
                {a.primary && <Plus className="h-5 w-5 text-white shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${a.primary ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{a.label}</p>
                  <p className={`text-xs mt-0.5 ${a.primary ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>{a.desc}</p>
                </div>
                <ArrowRight className={`h-4 w-4 shrink-0 ${a.primary ? 'text-white/70' : 'text-gray-300 dark:text-gray-600'}`} />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
