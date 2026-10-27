import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import SkeletonBlock, { Bar, StatCardsSkeleton, ListSkeleton } from '../Skeleton';
import { Page, PageHeader, Button, StatCard } from '../ui';
import {
  Users, BookOpen, Trophy, TrendingUp, Plus, ArrowRight,
  BarChart2, Download, Star,
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats,    setStats]    = useState(null);
  const [pending,  setPending]  = useState(0);
  const [recent,   setRecent]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const { isAdmin } = useContext(AuthContext);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard/stats').catch(() => ({ data: null })),
      // Review moderation is platform-admin only
      isAdmin ? api.get('/reviews/all').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      api.get('/admin/quizzes/attempts/recent').catch(() => ({ data: { attempts: [] } })),
    ]).then(([statsRes, reviewsRes, attemptsRes]) => {
      setStats(statsRes.data);
      const reviews = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
      setPending(reviews.filter(r => !r.approved).length);
      const attempts = attemptsRes.data?.attempts || [];
      setRecent(attempts.slice(0, 5));
    }).finally(() => setLoading(false));
  }, [isAdmin]);

  if (loading) return (
    <Page>
        <SkeletonBlock label="Loading admin dashboard">
          <div className="space-y-8">
            <Bar className="h-7 w-52" />
            <StatCardsSkeleton />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card p-5">
                  <Bar className="h-5 w-5 mb-3" />
                  <Bar className="h-4 w-28 mb-2" />
                  <Bar className="h-3 w-36 bg-gray-100 dark:bg-gray-800/60" />
                </div>
              ))}
            </div>
            <ListSkeleton rows={4} />
          </div>
        </SkeletonBlock>
    </Page>
  );

  const statCards = [
    { label: 'Total users',    value: stats?.totalUsers    ?? '—', icon: Users,      tone: 'brand' },
    { label: 'Total quizzes',  value: stats?.totalQuizzes  ?? '—', icon: BookOpen,   tone: 'blue' },
    { label: 'Total attempts', value: stats?.totalAttempts ?? '—', icon: Trophy,     tone: 'amber' },
    { label: 'Active users',   value: stats?.activeUsers   ?? '—', icon: TrendingUp, tone: 'green' },
  ];

  // Analytics, reports, users and reviews are platform-wide, so org admins don't get those tiles
  const actions = [
    { label: 'Create quiz',     desc: 'Add a new quiz',                      to: '/admin/quizzes/create', icon: Plus,         primary: true },
    { label: 'Analytics',       desc: 'Charts, trends & performance data',   to: '/admin/analytics',      icon: BarChart2, platformOnly: true },
    { label: 'Reports',         desc: 'Export users & attempts as CSV',       to: '/admin/reports',        icon: Download,  platformOnly: true },
    { label: 'Manage quizzes',  desc: 'Edit, publish, or delete quizzes',    to: '/admin/quizzes',        icon: BookOpen },
    { label: 'Manage users',    desc: 'View and edit user accounts',         to: '/admin/users',          icon: Users,     platformOnly: true },
    {
      label: 'Manage reviews',
      desc: 'Approve or remove testimonials',
      to: '/admin/reviews',
      icon: Star,
      badge: pending > 0 ? pending : null,
      platformOnly: true,
    },
  ].filter(a => isAdmin || !a.platformOnly);

  return (
    <Page className="space-y-8">

        <PageHeader
          title="Admin"
          description={isAdmin ? 'Platform overview' : 'Your organisation at a glance'}
          actions={<Button to="/admin/quizzes/create" icon={Plus}>New quiz</Button>}
        />

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
            <StatCard key={i} icon={s.icon} label={s.label} value={s.value} tone={s.tone} />
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
                className={`relative flex items-center gap-3 p-4 rounded-2xl border shadow-card transition-colors group ${
                  a.primary
                    ? 'bg-brand-600 border-brand-600 hover:bg-brand-700'
                    : 'bg-white dark:bg-gray-900 border-gray-200/80 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-700'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  a.primary
                    ? 'bg-brand-500'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <a.icon className={`h-4 w-4 ${a.primary ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${a.primary ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{a.label}</p>
                  <p className={`text-xs mt-0.5 truncate ${a.primary ? 'text-brand-200' : 'text-gray-400 dark:text-gray-500'}`}>{a.desc}</p>
                </div>
                {a.badge && (
                  <span className="absolute top-2 right-2 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-amber-500 text-white text-xs font-bold rounded-full">
                    {a.badge}
                  </span>
                )}
                {!a.badge && (
                  <ArrowRight className={`h-4 w-4 shrink-0 ${a.primary ? 'text-brand-200' : 'text-gray-300 dark:text-gray-600'}`} />
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        {recent.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Recent activity</h2>
            <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-5 py-3 font-medium">User</th>
                    <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Quiz</th>
                    <th className="text-right px-5 py-3 font-medium">Score</th>
                    <th className="text-right px-5 py-3 font-medium hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {recent.map((a, i) => (
                    <tr key={a._id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                        {a.user?.name || <span className="italic text-gray-400">Deleted user</span>}
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell max-w-[16rem] truncate">
                        {a.quiz?.title || <span className="italic text-gray-400">Deleted quiz</span>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span title={a.quiz ? `Pass mark ${a.quiz.passScore}%` : undefined} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          a.passed === null || a.passed === undefined
                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                            : a.passed
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {a.score}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-400 hidden sm:table-cell">
                        {new Date(a.completedAt || a.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

    </Page>
  );
};

export default AdminDashboard;
