import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { TrendingUp, Award, Target, Star } from 'lucide-react';
import { Page, PageHeader, Spinner, ErrorState, StatCard } from '../ui';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { maxTicksLimit: 8, color: '#94a3b8', font: { size: 11 } } },
    y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 11 } }, beginAtZero: true },
  },
};

const fill30Days = (data) => {
  const map = Object.fromEntries(data.map(d => [d.date, d.count]));
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    const key = d.toISOString().split('T')[0];
    return { date: key.slice(5), count: map[key] || 0 };
  });
};

const AdminAnalytics = () => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);

  useEffect(() => {
    api.get('/admin/analytics')
      .then(r => setData(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Page><Spinner label="Loading analytics" /></Page>
  );

  if (error) return (
    <Page><ErrorState title="Failed to load analytics." /></Page>
  );

  const attempts30 = fill30Days(data.attemptsByDay);
  const users30    = fill30Days(data.usersByDay);

  const attemptsChart = {
    labels: attempts30.map(d => d.date),
    datasets: [{
      data: attempts30.map(d => d.count),
      fill: true,
      tension: 0.4,
      borderColor: '#14a399',
      backgroundColor: 'rgba(20,163,153,0.08)',
      pointRadius: 0,
      borderWidth: 2,
    }],
  };

  const usersChart = {
    labels: users30.map(d => d.date),
    datasets: [{
      data: users30.map(d => d.count),
      fill: true,
      tension: 0.4,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16,185,129,0.08)',
      pointRadius: 0,
      borderWidth: 2,
    }],
  };

  const scoreChart = {
    labels: data.scoreDistribution.map(d => d.range),
    datasets: [{
      data: data.scoreDistribution.map(d => d.count),
      backgroundColor: ['#f87171', '#fb923c', '#facc15', '#34d399', '#14a399'],
      borderRadius: 6,
    }],
  };

  const kpis = [
    { label: 'Pass rate',       value: `${data.summary.passRate}%`,   icon: Award,     tone: 'green' },
    { label: 'Avg score',       value: `${data.summary.avgScore}%`,   icon: Target,    tone: 'brand' },
    { label: 'Total attempts',  value: data.summary.totalAttempts,    icon: TrendingUp, tone: 'blue' },
    { label: 'Pending reviews', value: data.pendingReviews,           icon: Star,      tone: 'amber' },
  ];

  return (
    <Page className="space-y-8">

        <PageHeader
          back={{ to: '/admin', label: 'Admin' }}
          title="Analytics"
          description="Platform performance — last 30 days"
        />

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <StatCard key={i} icon={k.icon} label={k.label} value={k.value} tone={k.tone} />
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attempts trend */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card p-6">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Quiz attempts</p>
            <p className="text-xs text-gray-400 mb-5">Daily completions — last 30 days</p>
            <div className="h-48">
              <Line data={attemptsChart} options={CHART_DEFAULTS} />
            </div>
          </div>

          {/* User registrations */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card p-6">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">New registrations</p>
            <p className="text-xs text-gray-400 mb-5">New users per day — last 30 days</p>
            <div className="h-48">
              <Line data={usersChart} options={CHART_DEFAULTS} />
            </div>
          </div>
        </div>

        {/* Score distribution + Top quizzes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score distribution */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card p-6">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Score distribution</p>
            <p className="text-xs text-gray-400 mb-5">All-time percentage scores</p>
            <div className="h-48">
              <Bar data={scoreChart} options={CHART_DEFAULTS} />
            </div>
          </div>

          {/* Top quizzes */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card p-6">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Top quizzes by attempts</p>
            {data.topQuizzes.length === 0 ? (
              <p className="text-sm text-gray-400">No attempt data yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left pb-2 font-medium">Quiz</th>
                    <th className="text-right pb-2 font-medium">Attempts</th>
                    <th className="text-right pb-2 font-medium">Avg score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {data.topQuizzes.map((q, i) => (
                    <tr key={i}>
                      <td className="py-2.5 text-gray-700 dark:text-gray-300 truncate max-w-[180px]">{q.title}</td>
                      <td className="py-2.5 text-right font-medium text-gray-900 dark:text-white">{q.attempts}</td>
                      <td className="py-2.5 text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          q.avgScore >= 60
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {q.avgScore}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

    </Page>
  );
};

export default AdminAnalytics;
