import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { Loader, AlertTriangle, ArrowLeft, Users, CheckCircle, BarChart2, Clock, Trophy, Download } from 'lucide-react';

/* ── SVG bar chart ───────────────────────────────────────────────────────── */
const BarChart = ({ data, color = '#4f46e5', height = 160 }) => {
  if (!data || data.length === 0) return <p className="text-center text-sm text-gray-400 py-8">No data</p>;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barW = 100 / data.length;
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${Math.max(data.length * 40, 300)} ${height + 32}`} className="w-full" preserveAspectRatio="xMidYMax meet">
        {data.map((d, i) => {
          const bh = (d.value / maxVal) * height;
          const x  = i * (100 / data.length) + barW * 0.15;
          const w  = barW * 0.7;
          return (
            <g key={i}>
              <rect x={`${x}%`} y={height - bh} width={`${w}%`} height={bh}
                fill={color} opacity="0.85" rx="2" />
              <text x={`${x + w / 2}%`} y={height + 16} textAnchor="middle"
                fontSize="7" fill="currentColor" className="text-gray-500 dark:text-gray-400">
                {d.label?.length > 12 ? d.label.slice(0, 10) + '…' : d.label}
              </text>
              <text x={`${x + w / 2}%`} y={height - bh - 4} textAnchor="middle"
                fontSize="7" fill={color} fontWeight="600">
                {Math.round(d.value)}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* ── Component ───────────────────────────────────────────────────────────── */
const QuizStatistics = () => {
  const { id } = useParams();
  const [quiz,  setQuiz]  = useState(null);
  const [stats, setStats] = useState(null);
  const [recent,setRecent]= useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState('summary');

  useEffect(() => {
    Promise.all([
      api.get(`/quizzes/${id}`),
      api.get(`/quizzes/${id}/statistics`),
      api.get(`/quizzes/${id}/attempts?limit=10`),
    ]).then(([qr, sr, ar]) => {
      setQuiz(qr.data.quiz);
      setStats(sr.data.statistics);
      setRecent(ar.data.attempts || []);
    }).catch(() => setError('Failed to load statistics.'))
    .finally(() => setLoading(false));
  }, [id]);

  const downloadCSV = () => {
    if (!stats?.questionStats) return;
    const rows = [
      ['Question', 'Correct', 'Total Attempts', 'Success Rate (%)'],
      ...stats.questionStats.map(q => [
        `"${q.text?.replace(/"/g, '""')}"`,
        q.correctCount,
        q.totalAttempts,
        q.successRate?.toFixed(1),
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${quiz?.title || 'quiz'}-stats.csv`;
    a.click();
  };

  if (loading) return <div className="flex justify-center items-center min-h-[50vh] bg-white dark:bg-gray-950"><Loader className="animate-spin h-6 w-6 text-indigo-500" /></div>;
  if (error)   return (
    <div className="min-h-[50vh] bg-white dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{error}</p>
        <Link to="/admin/quizzes" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">← Back</Link>
      </div>
    </div>
  );

  const kpis = [
    { label: 'Total attempts',   value: stats?.totalAttempts ?? 0,                      icon: Users },
    { label: 'Avg score',        value: `${Math.round(stats?.averageScore ?? 0)}%`,     icon: BarChart2 },
    { label: 'Pass rate',        value: `${Math.round(stats?.passRate ?? 0)}%`,          icon: CheckCircle },
    { label: 'Unique students',  value: stats?.uniqueUsers ?? 0,                         icon: Trophy },
  ];

  const questionBars = (stats?.questionStats || []).map(q => ({
    label: q.text?.slice(0, 20) || 'Q',
    value: q.successRate ?? 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <Link to="/admin/quizzes" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 mb-2">
              <ArrowLeft className="h-3.5 w-3.5" /> Quizzes
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quiz?.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{quiz?.category} · {quiz?.difficulty}</p>
          </div>
          <button onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
          {kpis.map((k, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <k.icon className="h-5 w-5 text-indigo-500 mb-3" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{k.value}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-lg w-fit">
          {[['summary', 'Summary'], ['questions', 'Questions'], ['attempts', 'Recent Attempts']].map(([val, label]) => (
            <button key={val} onClick={() => setTab(val)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors
                ${tab === val
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Summary tab */}
        {tab === 'summary' && (
          <div className="space-y-5">
            {questionBars.length > 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <h2 className="font-bold text-gray-900 dark:text-white mb-4">Question success rates</h2>
                <BarChart data={questionBars} color="#4f46e5" />
                <p className="text-xs text-gray-400 mt-2 text-center">% of students who answered each question correctly</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center text-gray-400 text-sm">
                No attempt data yet.
              </div>
            )}
          </div>
        )}

        {/* Questions tab */}
        {tab === 'questions' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <span className="col-span-6">Question</span>
              <span className="col-span-2 text-right">Correct</span>
              <span className="col-span-2 text-right">Attempts</span>
              <span className="col-span-2 text-right">Rate</span>
            </div>
            {(stats?.questionStats || []).length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">No question data.</div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {stats.questionStats.map((q, i) => (
                  <div key={i} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <p className="col-span-6 text-sm text-gray-900 dark:text-white truncate pr-4">{i + 1}. {q.text}</p>
                    <span className="col-span-2 text-right text-sm text-gray-600 dark:text-gray-300">{q.correctCount ?? 0}</span>
                    <span className="col-span-2 text-right text-sm text-gray-600 dark:text-gray-300">{q.totalAttempts ?? 0}</span>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${Math.min(q.successRate ?? 0, 100)}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-8 text-right">
                        {Math.round(q.successRate ?? 0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent attempts tab */}
        {tab === 'attempts' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <span className="col-span-4">Student</span>
              <span className="col-span-3 text-right">Score</span>
              <span className="col-span-3 text-right">Time</span>
              <span className="col-span-2 text-right">Date</span>
            </div>
            {recent.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">No attempts yet.</div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {recent.map((a, i) => (
                  <div key={i} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="col-span-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{a.user?.name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-400">{a.user?.email}</p>
                    </div>
                    <span className={`col-span-3 text-right text-sm font-semibold
                      ${a.score >= 70 ? 'text-green-600 dark:text-green-400' : a.score >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                      {a.score}%
                    </span>
                    <span className="col-span-3 text-right text-sm text-gray-500 dark:text-gray-400">
                      {a.timeTaken != null ? `${Math.floor(a.timeTaken / 60)}m ${a.timeTaken % 60}s` : '—'}
                    </span>
                    <span className="col-span-2 text-right text-xs text-gray-400">
                      {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizStatistics;
