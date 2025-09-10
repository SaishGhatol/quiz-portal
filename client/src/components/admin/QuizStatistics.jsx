import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Loader, AlertTriangle, ArrowLeft, Download, BarChart2, HelpCircle, Users, CheckCircle, Percent, Clock, SearchX } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const useQuizData = (quizId) => {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    if (!quizId) return;
    const fetchQuizData = async () => {
      try {
        setState({ data: null, loading: true, error: null });
        const [quizRes, statsRes, attemptsRes] = await Promise.all([
          api.get(`/quizzes/${quizId}`),
          api.get(`/quizzes/${quizId}/statistics`),
          api.get(`/quizzes/${quizId}/attempts?limit=10`)
        ]);
        
        setState({
          data: {
            quiz: quizRes.data.quiz,
            statistics: statsRes.data.statistics,
            attempts: attemptsRes.data.attempts || []
          },
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching stats:', error.response?.data || error.message);
        setState({ data: null, loading: false, error: 'Failed to load quiz statistics.' });
      }
    };
    fetchQuizData();
  }, [quizId]);

  return state;
};

const QuizStatistics = () => {
  const { id } = useParams();
  const { data, loading, error } = useQuizData(id);
  const [activeTab, setActiveTab] = useState('summary');
  
  const { quiz, statistics, attempts } = data || {};

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181b', // zinc-900
        titleColor: '#f4f4f5', // zinc-100
        bodyColor: '#a1a1aa', // zinc-400
        borderColor: '#3f3f46', // zinc-700
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#a1a1aa' }
      },
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#a1a1aa' }
      }
    }
  };

  const chartData = useMemo(() => {
    if (!statistics?.questionStats) return { bar: null, doughnut: null };
    
    const barData = {
      labels: statistics.questionStats.map((_, idx) => `Q${idx + 1}`),
      datasets: [{
        label: 'Success Rate',
        data: statistics.questionStats.map(q => q.successRate),
        backgroundColor: statistics.questionStats.map(q => 
          q.successRate >= 70 ? 'rgba(74, 222, 128, 0.5)' : 
          q.successRate >= 40 ? 'rgba(250, 204, 21, 0.5)' : 
          'rgba(248, 113, 113, 0.5)'
        ),
        borderColor: statistics.questionStats.map(q => 
          q.successRate >= 70 ? '#4ade80' : 
          q.successRate >= 40 ? '#facc15' : 
          '#f87171'
        ),
        borderWidth: 1,
        borderRadius: 4,
      }]
    };

    const totalQuestions = statistics.questionStats.length;
    const difficultyCounts = {
      easy: statistics.questionStats.filter(q => q.successRate >= 70).length,
      medium: statistics.questionStats.filter(q => q.successRate >= 40 && q.successRate < 70).length,
      hard: statistics.questionStats.filter(q => q.successRate < 40).length
    };

    const doughnutData = {
      labels: ['Easy', 'Medium', 'Hard'],
      datasets: [{
        data: [difficultyCounts.easy, difficultyCounts.medium, difficultyCounts.hard],
        backgroundColor: ['#22c55e', '#eab308', '#ef4444'],
        borderColor: '#18181b',
        borderWidth: 3,
      }]
    };

    return { bar: barData, doughnut: doughnutData, difficultyCounts };
  }, [statistics]);

  const downloadCSV = () => {
    if (!statistics || !quiz) return;
    let csv = "Question,Correct Count,Total Attempts,Success Rate (%)\n";
    statistics.questionStats.forEach((q, i) => {
      csv += `"${i+1}. ${q.text.replace(/"/g, '""')}",${q.correctCount},${q.totalAttempts},${q.successRate.toFixed(2)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${quiz.title.replace(/\s+/g, '_')}_stats.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const formatTime = (ms) => {
    if (isNaN(ms) || ms < 0) return 'N/A';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
        <Loader className="animate-spin h-8 w-8 mb-4" />
        <p className="font-semibold text-lg">Loading Statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-500/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Data</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to="/admin/quizzes" className="inline-flex items-center gap-2 px-5 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors">
            <ArrowLeft size={16} /> Back to Quizzes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Link to="/admin/quizzes" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} /> All Quizzes
          </Link>
          <h1 className="text-4xl font-bold text-white mt-1">{quiz.title}</h1>
        </div>
        <button onClick={downloadCSV} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
          <Download size={16} /> Export Report
        </button>
      </header>

      {statistics.totalAttempts === 0 ? (
        <div className="text-center py-20 bg-gray-950 border border-gray-800 rounded-2xl">
          <SearchX className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Data Yet</h3>
          <p className="text-gray-500">There are no attempts for this quiz. Statistics will appear here once users participate.</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-4"><p className="text-sm text-gray-400 mb-1">Total Attempts</p><p className="text-3xl font-bold text-white">{statistics.totalAttempts}</p></div>
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-4"><p className="text-sm text-gray-400 mb-1">Unique Takers</p><p className="text-3xl font-bold text-white">{statistics.uniqueUsers}</p></div>
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-4"><p className="text-sm text-gray-400 mb-1">Average Score</p><p className="text-3xl font-bold text-white">{statistics.averageScore.toFixed(1)}%</p></div>
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-4"><p className="text-sm text-gray-400 mb-1">Pass Rate</p><p className="text-3xl font-bold text-white">{statistics.passRate.toFixed(1)}%</p></div>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-800 mb-6">
            <nav className="flex space-x-6">
              <button onClick={() => setActiveTab('summary')} className={`py-3 px-1 text-sm font-semibold transition-colors ${activeTab === 'summary' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}>Summary</button>
              <button onClick={() => setActiveTab('questions')} className={`py-3 px-1 text-sm font-semibold transition-colors ${activeTab === 'questions' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}>Question Analysis</button>
              <button onClick={() => setActiveTab('attempts')} className={`py-3 px-1 text-sm font-semibold transition-colors ${activeTab === 'attempts' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}>Recent Attempts</button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className={`${activeTab === 'summary' ? 'block' : 'hidden'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-gray-950 border border-gray-800 rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">Difficulty Breakdown</h3>
                <div className="h-64 mx-auto max-w-[250px]"><Doughnut data={chartData.doughnut} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#a1a1aa' } }, tooltip: { ...chartOptions.plugins.tooltip } } }} /></div>
                <div className="mt-4 text-center text-sm text-gray-400">
                  <p>Easy: {chartData.difficultyCounts.easy} | Medium: {chartData.difficultyCounts.medium} | Hard: {chartData.difficultyCounts.hard}</p>
                </div>
              </div>
              <div className="lg:col-span-2 bg-gray-950 border border-gray-800 rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4">Question Success Rates</h3>
                <div className="h-80"><Bar data={chartData.bar} options={chartOptions} /></div>
              </div>
            </div>
          </div>
          
          <div className={`${activeTab === 'questions' ? 'block' : 'hidden'}`}>
            <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden">
                <table className="min-w-full"><thead className="bg-gray-900"><tr className="border-b border-gray-800"><th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">#</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Question</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Success Rate</th></tr></thead>
                <tbody className="divide-y divide-gray-800">{statistics.questionStats.map((q, i) => (<tr key={q.questionId} className="hover:bg-gray-900"><td className="px-5 py-4 text-sm text-gray-400">{i+1}</td><td className="px-5 py-4 text-sm text-white max-w-md truncate">{q.text}</td><td className="px-5 py-4 text-sm text-white">{q.successRate.toFixed(1)}%</td></tr>))}</tbody></table>
            </div>
          </div>

          <div className={`${activeTab === 'attempts' ? 'block' : 'hidden'}`}>
             <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden">
                <table className="min-w-full"><thead className="bg-gray-900"><tr className="border-b border-gray-800"><th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">User</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Score</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Time Taken</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Date</th><th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase"></th></tr></thead>
                <tbody className="divide-y divide-gray-800">{attempts.map(att => (<tr key={att._id} className="hover:bg-gray-900"><td className="px-5 py-4 text-sm text-white font-medium">{att.user?.name || 'Anonymous'}</td><td className="px-5 py-4 text-sm text-white">{att.score}/{att.maxScore} ({Math.round(att.score/att.maxScore*100)}%)</td><td className="px-5 py-4 text-sm text-white">{formatTime(new Date(att.completedAt) - new Date(att.startedAt))}</td><td className="px-5 py-4 text-sm text-gray-400">{new Date(att.completedAt).toLocaleDateString()}</td><td className="px-5 py-4 text-right"><Link to={`/attempts/${att._id}`} className="text-sm font-semibold text-gray-300 hover:text-white">Details</Link></td></tr>))}</tbody></table>
             </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QuizStatistics;

