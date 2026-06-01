import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Loader, TrendingUp, Award, Target, Star, ArrowLeft, AlertCircle } from 'lucide-react';
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
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader className="animate-spin h-6 w-6 text-indigo-500" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-400">
      <AlertCircle className="h-8 w-8" />
      <p>Failed to load analytics.</p>
    </div>
  );

  const attempts30 = fill30Days(data.attemptsByDay);
  const users30    = fill30Days(data.usersByDay);

  const attemptsChart = {
    labels: attempts30.map(d => d.date),
    datasets: [{
      data: attempts30.map(d => d.count),
      fill: true,
      tension: 0.4,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.08)',
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
      backgroundColor: ['#f87171', '#fb923c', '#facc15', '#34d399', '#6366f1'],
      borderRadius: 6,
    }],
  };

  const kpis = [
    { label: 'Pass rate',       value: `${data.summary.passRate}%`,   icon: Award,     color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Avg score',       value: `${data.summary.avgScore}%`,   icon: Target,    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Total attempts',  value: data.summary.totalAttempts,    icon: TrendingUp, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Pending reviews', value: data.pendingReviews,           icon: Star,      color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="h-4 w-4 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Platform performance — last 30 days</p>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${k.color}`}>
                <k.icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{k.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attempts trend */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Quiz attempts</p>
            <p className="text-xs text-gray-400 mb-5">Daily completions — last 30 days</p>
            <div className="h-48">
              <Line data={attemptsChart} options={CHART_DEFAULTS} />
            </div>
          </div>

          {/* User registrations */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
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
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Score distribution</p>
            <p className="text-xs text-gray-400 mb-5">All-time percentage scores</p>
            <div className="h-48">
              <Bar data={scoreChart} options={CHART_DEFAULTS} />
            </div>
          </div>

          {/* Top quizzes */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
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

      </div>
    </div>
  );
};

export default AdminAnalytics;
