import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Users, TrendingUp, CheckCircle, Trophy, Clock } from 'lucide-react';
import { Page, PageHeader, Spinner, ErrorState, EmptyState, StatCard } from '../ui';

const OrgAnalytics = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/org/analytics')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Page><Spinner label="Loading analytics" /></Page>;
  if (!data)   return <Page><ErrorState title="Could not load analytics." /></Page>;

  const { overview, batchStats, recentActivity } = data;

  return (
    <Page className="space-y-8">

        <PageHeader back={{ to: '/org', label: 'Organisation' }} title="Analytics" />

        {/* Overview stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Students',     value: overview.students,      icon: Users },
            { label: 'Batches',      value: overview.batches,       icon: TrendingUp },
            { label: 'Assignments',  value: overview.assignments,   icon: CheckCircle },
            { label: 'Quiz attempts', value: overview.totalAttempts, icon: Trophy, hint: 'Own & assigned quizzes' },
            { label: 'Avg score',    value: `${overview.avgScore}%`, icon: TrendingUp },
            { label: 'Pass rate',    value: `${overview.passRate}%`, icon: CheckCircle, hint: "Vs each quiz's pass mark" },
          ].map((s, i) => (
            <StatCard key={i} icon={s.icon} label={s.label} value={s.value} hint={s.hint} />
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-4">
          {overview.attemptScope || 'Completed attempts by your students on your own and assigned quizzes'}. Admin attempts and deactivated batches aren't counted.
        </p>

        {/* Batch performance */}
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Batch performance</h2>
          {batchStats.length === 0 ? (
            <EmptyState compact title="No batch data yet." />
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">
              <div className="grid grid-cols-12 px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
                <span className="col-span-4">Batch</span>
                <span className="col-span-2 text-right">Students</span>
                <span className="col-span-2 text-right">Attempts</span>
                <span className="col-span-4 pl-4">Avg score</span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {batchStats.map(b => (
                  <div key={b.batchId} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="col-span-4 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color || '#0b847c' }} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{b.name}</span>
                    </div>
                    <span className="col-span-2 text-right text-sm text-gray-600 dark:text-gray-300">{b.studentCount}</span>
                    <span className="col-span-2 text-right text-sm text-gray-600 dark:text-gray-300">{b.attemptCount}</span>
                    <div className="col-span-4 pl-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.min(b.avgScore, 100)}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-8">{b.avgScore}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Recent activity</h2>
          {recentActivity.length === 0 ? (
            <EmptyState compact title="No quiz activity yet." />
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {recentActivity.map((a, i) => {
                  const score = a.score ?? 0;
                  return (
                    <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                        ${score >= 70 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : score >= 40 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                        {score}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white truncate">
                          <span className="font-medium">{a.studentName}</span> completed <span className="font-medium">{a.quizTitle}</span>
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3" /> {new Date(a.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

    </Page>
  );
};

export default OrgAnalytics;
