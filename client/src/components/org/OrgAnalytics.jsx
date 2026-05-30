import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Loader, Users, TrendingUp, CheckCircle, Trophy, ArrowLeft, Clock } from 'lucide-react';

const OrgAnalytics = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/org/analytics')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader className="animate-spin h-6 w-6 text-indigo-500" /></div>;
  if (!data)   return <div className="text-center py-20 text-sm text-gray-400">Could not load analytics.</div>;

  const { overview, batchStats, recentActivity } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        <div>
          <Link to="/org" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">← Organisation</Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Analytics</h1>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Students',     value: overview.students,      icon: Users },
            { label: 'Batches',      value: overview.batches,       icon: TrendingUp },
            { label: 'Assignments',  value: overview.assignments,   icon: CheckCircle },
            { label: 'Attempts',     value: overview.totalAttempts, icon: Trophy },
            { label: 'Avg score',    value: `${overview.avgScore}%`, icon: TrendingUp },
            { label: 'Pass rate',    value: `${overview.passRate}%`, icon: CheckCircle },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <s.icon className="h-4 w-4 text-indigo-500 mb-2" />
              <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Batch performance */}
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Batch performance</h2>
          {batchStats.length === 0 ? (
            <div className="text-sm text-gray-400 py-8 text-center">No batch data yet.</div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <span className="col-span-4">Batch</span>
                <span className="col-span-2 text-right">Students</span>
                <span className="col-span-2 text-right">Attempts</span>
                <span className="col-span-4 pl-4">Avg score</span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {batchStats.map(b => (
                  <div key={b.batchId} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="col-span-4 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color || '#4f46e5' }} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{b.name}</span>
                    </div>
                    <span className="col-span-2 text-right text-sm text-gray-600 dark:text-gray-300">{b.studentCount}</span>
                    <span className="col-span-2 text-right text-sm text-gray-600 dark:text-gray-300">{b.attemptCount}</span>
                    <div className="col-span-4 pl-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.min(b.avgScore, 100)}%` }} />
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
            <div className="text-sm text-gray-400 py-8 text-center">No quiz activity yet.</div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
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

      </div>
    </div>
  );
};

export default OrgAnalytics;
