import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Loader, AlertTriangle, ArrowRight, User, Shapes, Sparkles, History } from 'lucide-react';

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
      className={`group relative bg-gray-950 border border-gray-800 rounded-2xl p-6 overflow-hidden transform transition-transform duration-300 ease-out hover:-translate-y-1 ${className}`}
    >
      <div
        className="absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 
                   before:absolute before:inset-0 before:rounded-xl 
                   before:bg-[radial-gradient(400px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(148,163,184,0.1),transparent_80%)] 
                   pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative z-10 h-full flex flex-col">{children}</div>
    </div>
  );
};

// Function to get a time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/dashboard');
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
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
        <p className="font-semibold text-lg">Loading Dashboard...</p>
      </div>
    );
  }

  if (error || !stats) { // Also check if stats is null
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <AlertTriangle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-6">{error || 'Could not retrieve dashboard statistics.'}</p>
          <button
            onClick={fetchDashboardData}
            className="px-5 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const completionPercentage = stats.totalQuizzes > 0 ? ((stats.totalAttempts / stats.totalQuizzes) * 100).toFixed(0) : 0;
  const progressMessage = completionPercentage >= 100 ? "You've completed all quizzes! Amazing!" : completionPercentage >= 50 ? "Over halfway there! Keep it up!" : "Start your journey. Every quiz counts!";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* --- FIXED CODE --- */}
          <h1 className="text-4xl font-bold text-white">{getGreeting()}, {stats?.user?.name?.split(' ')[0] || 'Explorer'}</h1>
          <p className="text-gray-400 mt-1">Ready for your next challenge?</p>
        </div>
        <Link to="/quizzes" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
            <Sparkles size={16} />
            Explore Quizzes
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
                <div className="relative h-24 w-24">
                    <svg className="h-full w-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" strokeWidth="10" fill="none" className="stroke-gray-800/80"/>
                        <circle 
                            cx="50" cy="50" r="45" strokeWidth="10" fill="none"
                            className="stroke-white transition-all duration-700 ease-out"
                            strokeDasharray={`${(completionPercentage * 2.83)} 283`}
                            strokeLinecap="round" transform="rotate(-90 50 50)"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold text-white">{completionPercentage}%</span>
                    </div>
                </div>
                <div className="text-center md:text-left">
                    <h3 className="text-xl font-semibold text-white mb-2">Your Quiz Progress</h3>
                    <p className="text-gray-400 max-w-sm">{progressMessage}</p>
                    <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
                      <Link to="/quizzes" className="w-full sm:w-auto px-6 py-3 bg-white text-black rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors">
                        Continue Learning
                      </Link>
                      <Link to="/my-attempts" className="w-full sm:w-auto text-sm text-gray-400 hover:text-white transition-colors">View All Attempts</Link>
                    </div>
                </div>
            </div>
        </Card>

        <Card className="lg:col-span-1">
          <div className="flex items-center justify-between text-gray-400 gap-3">
            <Shapes size={20} />
            <h3 className="font-semibold text-sm">Quizzes Available</h3>
          </div>
          <p className="text-5xl font-bold text-white my-4">{stats.totalQuizzes}</p>
          <div className="flex-grow"></div>
          <Link to="/quizzes" className="text-sm font-semibold text-gray-300 hover:text-white flex items-center gap-1">
            Browse All <ArrowRight size={14} />
          </Link>
        </Card>
        
        <div className="lg:col-span-3 bg-gray-950 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-gray-400 gap-3">
              <History size={18} />
              <h3 className="font-semibold text-white">Recent Activity</h3>
            </div>
            {stats.completedQuizzes?.length > 0 && (
                 <Link to="/my-attempts" className="text-xs font-semibold text-gray-400 hover:text-white">View All</Link>
            )}
          </div>
          {/* Defensive check for completedQuizzes */}
          {stats.completedQuizzes && stats.completedQuizzes.length > 0 ? (
            <div className="space-y-2">
              {stats.completedQuizzes.slice(0, 5).map(quiz => (
                <Link to={`/attempts/${quiz.attemptId}`} key={quiz.attemptId} className="block p-4 rounded-lg hover:bg-gray-900 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{quiz.title}</p>
                      <p className="text-xs text-gray-500 mt-1">Category: {quiz.category}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm w-full sm:w-auto">
                        <p className="font-medium text-white">{quiz.score}<span className="text-gray-500">/{quiz.totalQuestions}</span></p>
                        <p className="text-gray-500 text-xs text-right flex-1 sm:flex-none">
                          {new Date(quiz.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
                <p className="text-gray-500">No recent activity to display.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;