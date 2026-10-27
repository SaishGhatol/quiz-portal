import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Users, BookOpen, Layers, BarChart2, ArrowRight, Copy, RefreshCw, Check, Bell, Plus, CreditCard } from 'lucide-react';
import { Page, PageHeader, Button, Spinner, ErrorState, EmptyState } from '../ui';
import { toast } from 'react-toastify';

const PLAN_BADGE = {
  free:       'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  basic:      'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  pro:        'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
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

  if (loading) return <Page><Spinner label="Loading organisation" /></Page>;
  if (!data)   return <Page><ErrorState title="Could not load organisation." /></Page>;

  const { org, stats } = data;

  return (
    <Page className="space-y-8">

        <PageHeader
          title={
            <span className="inline-flex flex-wrap items-center gap-3">
              {org.name}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${PLAN_BADGE[org.plan] || PLAN_BADGE.free}`}>
                {org.plan}
              </span>
            </span>
          }
          description={<><span className="capitalize">{org.type}</span> · {org.contactEmail}</>}
          actions={
            <>
              <Button to="/admin/quizzes/create" size="sm" icon={Plus}>New quiz</Button>
              <Button to="/org/billing" size="sm" variant="ghost">Upgrade →</Button>
            </>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Students', value: stats?.studentCount ?? 0, icon: Users,    to: '/org/students' },
            { label: 'Batches',  value: stats?.batchCount   ?? 0, icon: Layers,   to: '/org/batches' },
            { label: 'Quizzes',  value: stats?.quizCount    ?? 0, icon: BookOpen, to: '/admin/quizzes' }, // org_admin can access this via AdminRoute
          ].map((s, i) => (
            <Link key={i} to={s.to}
              className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card p-5 hover:border-brand-300 dark:hover:border-brand-700 transition-colors group">
              <s.icon className="h-5 w-5 text-brand-500 mb-3" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                {s.label} <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </Link>
          ))}
        </div>

        {/* Invite code */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Student invite code</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Share with students to let them join your organisation.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center px-5 py-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg">
              <span className="text-2xl font-mono font-bold tracking-[0.25em] text-brand-700 dark:text-brand-300">
                {org.inviteCode}
              </span>
            </div>
            <Button variant="secondary" icon={copied ? Check : Copy} onClick={copyCode}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <button onClick={regen} title="Generate new code" aria-label="Generate new code"
              className="h-10 w-10 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
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
              { label: 'Billing',       desc: 'Plan, upgrades & invoices',  icon: CreditCard, to: '/org/billing' },
            ].map((a, i) => (
              <Link key={i} to={a.to}
                className={`flex items-center gap-3 p-4 rounded-2xl border shadow-card transition-colors
                  ${a.accent
                    ? 'bg-brand-600 border-brand-600 hover:bg-brand-700'
                    : 'bg-white dark:bg-gray-900 border-gray-200/80 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-800'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${a.accent ? 'bg-white/20' : 'bg-brand-50 dark:bg-brand-900/30'}`}>
                  <a.icon className={`h-5 w-5 ${a.accent ? 'text-white' : 'text-brand-500'}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${a.accent ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{a.label}</p>
                  <p className={`text-xs mt-0.5 ${a.accent ? 'text-brand-100' : 'text-gray-400 dark:text-gray-500'}`}>{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Bell className="h-4 w-4 text-gray-400" /> Announcements
            </div>
            <Link to="/org/announcements" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">Manage</Link>
          </div>
          {ann.length === 0 ? (
            <EmptyState
              compact
              icon={Bell}
              title="No announcements yet."
              action={<Button to="/org/announcements" variant="soft" size="sm">Post one</Button>}
            />
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

    </Page>
  );
};

export default OrgDashboard;
