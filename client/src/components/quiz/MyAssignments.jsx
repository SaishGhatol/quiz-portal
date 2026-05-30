import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Loader, BookOpen, Clock, Calendar, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';

const statusOf = a => {
  if (a.dueDate && new Date(a.dueDate) < new Date()) return 'expired';
  if (a.startDate && new Date(a.startDate) > new Date()) return 'upcoming';
  return 'active';
};

const STATUS = {
  active:   { label: 'Active',    cls: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' },
  upcoming: { label: 'Upcoming',  cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
  expired:  { label: 'Expired',   cls: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' },
};

const DIFF = {
  easy:   'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  medium: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  hard:   'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
};

const MyAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('all');

  useEffect(() => {
    api.get('/org/my-assignments')
      .then(r => setAssignments(r.data.assignments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = assignments.filter(a => filter === 'all' || statusOf(a) === filter);

  if (loading) return <div className="flex justify-center items-center min-h-[50vh] bg-white dark:bg-gray-950"><Loader className="animate-spin h-6 w-6 text-indigo-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Assignments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Quizzes assigned to you by your organisation.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-lg w-fit">
          {[['all', 'All'], ['active', 'Active'], ['upcoming', 'Upcoming'], ['expired', 'Expired']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors
                ${filter === val
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
            <BookOpen className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="font-medium text-gray-700 dark:text-gray-300">
              {filter === 'all' ? 'No assignments yet' : `No ${filter} assignments`}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {filter === 'all' ? 'Your organisation admin will assign quizzes to your batch.' : 'Try a different filter.'}
            </p>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Show all</button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a, i) => {
              const status = statusOf(a);
              const st     = STATUS[status];
              const q      = a.quiz;
              const canTake = status === 'active';

              return (
                <div key={a._id}
                  className={`bg-white dark:bg-gray-900 border rounded-xl overflow-hidden transition-colors
                    ${canTake ? 'border-gray-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800' : 'border-gray-100 dark:border-gray-800 opacity-75'}`}>
                  {/* Batch colour strip */}
                  {a.batch?.color && <div className="h-1 w-full" style={{ backgroundColor: a.batch.color }} />}

                  <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${st.cls}`}>{st.label}</span>
                        {q?.difficulty && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg capitalize ${DIFF[q.difficulty] || DIFF.medium}`}>
                            {q.difficulty}
                          </span>
                        )}
                        {a.batch && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">{a.batch.name}</span>
                        )}
                      </div>

                      <h3 className="font-semibold text-gray-900 dark:text-white">{q?.title || 'Unknown Quiz'}</h3>
                      {q?.category && <p className="text-xs text-gray-400 mt-0.5">{q.category}</p>}

                      {/* Meta info */}
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400 dark:text-gray-500">
                        {q?.totalQuestions > 0 && (
                          <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{q.totalQuestions} questions</span>
                        )}
                        {q?.timeLimit > 0 && (
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{q.timeLimit} min</span>
                        )}
                        {a.maxAttempts && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Max {a.maxAttempts} attempt{a.maxAttempts !== 1 ? 's' : ''}
                          </span>
                        )}
                        {a.dueDate && (
                          <span className={`flex items-center gap-1 ${status === 'expired' ? 'text-red-500 dark:text-red-400' : ''}`}>
                            <Calendar className="h-3.5 w-3.5" />
                            Due {new Date(a.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {a.startDate && status === 'upcoming' && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Opens {new Date(a.startDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {a.instructions && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                          {a.instructions}
                        </p>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="shrink-0 flex items-center sm:pt-6">
                      {canTake ? (
                        <Link to={`/quiz/${q?._id}`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
                          Start <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : status === 'upcoming' ? (
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                          Not open yet
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                          Expired
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && assignments.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Not part of an organisation yet?{' '}
              <Link to="/org/join" className="text-indigo-600 dark:text-indigo-400 hover:underline">Join with an invite code</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAssignments;
