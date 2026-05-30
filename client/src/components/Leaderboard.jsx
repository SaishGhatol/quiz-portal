import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Clock, Loader, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import AuthContext from '../contexts/AuthContext';

const Leaderboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    api.get('/quizzes/leaderboard?limit=50')
      .then(r => setEntries(r.data.leaderboard || []))
      .catch(() => setError('Failed to load leaderboard.'))
      .finally(() => setLoading(false));
  }, []);

  const formatTime = s => {
    if (s == null) return '—';
    return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
  };

  const rankLabel = i => ['🥇', '🥈', '🥉'][i] ?? `#${i + 1}`;

  if (loading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader className="animate-spin h-6 w-6 text-blue-500" /></div>;

  if (error) return (
    <div className="flex justify-center items-center min-h-[50vh] px-4">
      <div className="text-center">
        <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="h-6 w-6 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Top scores, ranked by percentage then time.</p>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-20 border border-gray-200 dark:border-gray-800 rounded-xl">
            <Trophy className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No completed quizzes yet.</p>
            <Link to="/quizzes" className="mt-3 inline-block text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Be the first — take a quiz</Link>
          </div>
        ) : (
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
            {/* Table header */}
            <div className="grid grid-cols-12 px-5 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span className="col-span-1">#</span>
              <span className="col-span-4">Player</span>
              <span className="col-span-4">Quiz</span>
              <span className="col-span-2 text-right">Score</span>
              <span className="col-span-1 text-right">Time</span>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {entries.map((e, i) => {
                const isMe = e?.user?._id === currentUser?._id;
                return (
                  <div key={i} className={`grid grid-cols-12 items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isMe ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : ''}`}>
                    <span className="col-span-1 text-sm font-semibold text-gray-500 dark:text-gray-400">{rankLabel(i)}</span>
                    <div className="col-span-4 flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 shrink-0">
                        {e?.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className={`text-sm font-medium truncate ${isMe ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                        {e?.user?.name || 'Anonymous'}{isMe ? ' (you)' : ''}
                      </span>
                    </div>
                    <span className="col-span-4 text-sm text-gray-400 dark:text-gray-500 truncate pr-2">{e?.quiz?.title || '—'}</span>
                    <span className={`col-span-2 text-right text-sm font-bold ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700 dark:text-amber-600' : 'text-gray-700 dark:text-gray-300'}`}>
                      {e?.score ?? '—'}%
                    </span>
                    <span className="col-span-1 text-right text-xs text-gray-400 flex items-center justify-end gap-0.5">
                      <Clock className="h-3 w-3 shrink-0" />{formatTime(e?.timeTaken)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!currentUser && (
          <p className="text-center text-sm text-gray-400 mt-5">
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline">Create an account</Link> to appear on the leaderboard.
          </p>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
