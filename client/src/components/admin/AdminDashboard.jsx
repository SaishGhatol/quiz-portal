import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import {
  Activity, Users, FileText, PlusCircle, Settings, Loader, AlertTriangle, ArrowRight, BarChart2
} from 'lucide-react';

// A reusable, interactive card with the mouse-tracking aurora effect
const Card = ({ children, className = '' }) => {
  const cardRef = useRef(null);
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`group relative bg-gray-950 border border-gray-800 rounded-2xl p-6 overflow-hidden ${className}`}
    >
      <div
        className="absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 
                   before:absolute before:inset-0 before:rounded-xl 
                   before:bg-[radial-gradient(400px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(148,163,184,0.08),transparent_80%)] 
                   pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative z-10 h-full flex flex-col">{children}</div>
    </div>
  );
};

// Helper function to format relative time
const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, quizzesRes, attemptsRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/quizzes?limit=5'),
        api.get('/attempts/all?limit=5')
      ]);

      setStats(statsRes.data);

      const quizzes = quizzesRes.data.quizzes.map(q => ({ type: 'quiz', ...q }));
      const attempts = attemptsRes.data.attempts.map(a => ({ type: 'attempt', ...a }));
      
      const combinedFeed = [...quizzes, ...attempts]
        .sort((a, b) => new Date(b.createdAt || b.completedAt) - new Date(a.createdAt || a.completedAt))
        .slice(0, 10);
      
      setActivityFeed(combinedFeed);

    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
        <Loader className="animate-spin h-8 w-8 mb-4" />
        <p className="font-semibold text-lg">Loading Admin Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-500/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={fetchDashboardData} className="inline-flex items-center gap-2 px-5 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  const quickActions = [
      { name: 'Create Quiz', href: '/admin/quizzes/create', icon: PlusCircle },
      { name: 'Manage Quizzes', href: '/admin/quizzes', icon: Settings },
      { name: 'Manage Users', href: '/admin/users', icon: Users },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">An overview of your quiz portal's activity.</p>
        </div>
         <div className="flex items-center gap-3">
            {quickActions.map(action => (
                 <Link key={action.name} to={action.href} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                    <action.icon size={16} /> {action.name}
                </Link>
            ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stat Cards */}
        <Card className="lg:col-span-1">
          <div className="flex items-center text-gray-400 gap-3"><Users size={18} /><h3 className="font-semibold text-sm">Total Users</h3></div>
          <p className="text-5xl font-bold text-white my-2">{stats.totalUsers.toLocaleString()}</p>
        </Card>
        
        <Card className="lg:col-span-1">
          <div className="flex items-center text-gray-400 gap-3"><FileText size={18} /><h3 className="font-semibold text-sm">Total Quizzes</h3></div>
          <p className="text-5xl font-bold text-white my-2">{stats.totalQuizzes.toLocaleString()}</p>
        </Card>

        <Card className="lg:col-span-1">
          <div className="flex items-center text-gray-400 gap-3"><Activity size={18} /><h3 className="font-semibold text-sm">Total Attempts</h3></div>
          <p className="text-5xl font-bold text-white my-2">{stats.totalAttempts.toLocaleString()}</p>
        </Card>

        {/* Full-width Activity Feed */}
        <div className="lg:col-span-3 bg-gray-950 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Activity</h3>
          </div>
          <div className="space-y-1 -mx-3">
            {activityFeed.length > 0 ? (
                activityFeed.map(item => (
              <div key={item._id} className="flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-gray-900 transition-colors">
                <div className="w-8 h-8 flex-shrink-0 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
                  {item.type === 'quiz' ? <FileText size={16} className="text-gray-400" /> : <Activity size={16} className="text-gray-400" />}
                </div>
                <div className="flex-grow text-sm">
                  {item.type === 'quiz' ? (
                    <p className="text-gray-300">New quiz <Link to={`/admin/quizzes/${item._id}/edit`} className="font-semibold text-white hover:underline">{item.title}</Link> was created.</p>
                  ) : (
                    <p className="text-gray-300"><span className="font-semibold text-white">{item.user?.name || 'A user'}</span> completed the <Link to={`/quiz/${item.quiz?._id}`} className="font-semibold text-white hover:underline">{item.quiz?.title || 'a quiz'}</Link>.</p>
                  )}
                </div>
                <div className="text-xs text-gray-500 flex-shrink-0">
                  {formatRelativeTime(item.createdAt || item.completedAt)}
                </div>
              </div>
            ))
            ) : (
                <div className="text-center py-10">
                    <p className="text-gray-500">No recent activity to display.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

