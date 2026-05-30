import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Loader, Users, BookOpen, Layers, BarChart2, ArrowRight, Copy, RefreshCw, Check, Bell, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

const PLAN_BADGE = {
  free:       'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  basic:      'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  pro:        'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  enterprise: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
};

const OrgDashboard = () => {
  const [data,    setData]    = useState(null);
  const [ann,     setAnn]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    Promise.all([api.get('/org/me'), api.get('/org/announcements')])
      .then(([o, a]) => { setData(o.data); setAnn(a.data.announcements || []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(data?.org?.inviteCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regen = async () => {
    try {
      const r = await api.post('/org/invite/regenerate');
      setData(p => ({ ...p, org: { ...p.org, inviteCode: r.data.inviteCode } }));
      toast.success('New invite code generated');
    } catch { toast.error('Failed to regenerate code'); }
  };

  if (loading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader className="animate-spin h-6 w-6 text-indigo-500" /></div>;
  if (!data)   return <div className="text-center py-20 text-sm text-gray-400">Could not load organisation.</div>;

  const { org, stats } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{org.name}</h1>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${PLAN_BADGE[org.plan] || PLAN_BADGE.free}`}>
                {org.plan}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{org.type} · {org.contactEmail}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/quizzes/create"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
              <Plus className="h-3.5 w-3.5" /> New quiz
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              Upgrade →
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Students', value: stats?.studentCount ?? 0, icon: Users,    to: '/org/students' },
            { label: 'Batches',  value: stats?.batchCount   ?? 0, icon: Layers,   to: '/org/batches' },
            { label: 'Quizzes',  value: stats?.quizCount    ?? 0, icon: BookOpen, to: '/admin/quizzes' }, // org_admin can access this via AdminRoute
          ].map((s, i) => (
            <Link key={i} to={s.to}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group">
              <s.icon className="h-5 w-5 text-indigo-500 mb-3" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                {s.label} <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </Link>
          ))}
        </div>

        {/* Invite code */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Student invite code</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Share with students to let them join your organisation.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center px-5 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <span className="text-2xl font-mono font-bold tracking-[0.25em] text-indigo-700 dark:text-indigo-300">
                {org.inviteCode}
              </span>
            </div>
            <button onClick={copyCode}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={regen} title="Generate new code"
              className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Manage</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Batches',       desc: 'Create & manage classes',    icon: Layers,    to: '/org/batches',       accent: true },
              { label: 'Students',      desc: 'View all enrolled students', icon: Users,     to: '/org/students' },
              { label: 'Assignments',   desc: 'Assign quizzes to batches',  icon: BookOpen,  to: '/org/assignments' },
              { label: 'Analytics',     desc: 'Scores, pass rates & more',  icon: BarChart2, to: '/org/analytics' },
              { label: 'Announcements', desc: 'Post notices to students',   icon: Bell,      to: '/org/announcements' },
              { label: 'Quiz Library',  desc: 'Create & manage quizzes',    icon: BookOpen,  to: '/admin/quizzes' },
            ].map((a, i) => (
              <Link key={i} to={a.to}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-colors
                  ${a.accent
                    ? 'bg-indigo-600 border-indigo-600 hover:bg-indigo-700'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${a.accent ? 'bg-white/20' : 'bg-indigo-50 dark:bg-indigo-900/30'}`}>
                  <a.icon className={`h-5 w-5 ${a.accent ? 'text-white' : 'text-indigo-500'}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${a.accent ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{a.label}</p>
                  <p className={`text-xs mt-0.5 ${a.accent ? 'text-indigo-100' : 'text-gray-400 dark:text-gray-500'}`}>{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Bell className="h-4 w-4 text-gray-400" /> Announcements
            </div>
            <Link to="/org/announcements" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Manage</Link>
          </div>
          {ann.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              No announcements yet.{' '}
              <Link to="/org/announcements" className="text-indigo-600 dark:text-indigo-400 hover:underline">Post one</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {ann.slice(0, 3).map((a, i) => (
                <div key={i} className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{a.isPinned ? '📌 ' : ''}{a.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{a.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default OrgDashboard;
