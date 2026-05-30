import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import AuthContext from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import {
  Loader, BookOpen, Clock, CheckCircle, AlertCircle,
  ArrowRight, Layers, XCircle, Building2, Users
} from 'lucide-react';

/* Countdown badge */
const TimeLeft = ({ dueDate }) => {
  if (!dueDate) return null;
  const ms = new Date(dueDate) - new Date();
  if (ms < 0) return <span className="text-xs font-semibold text-red-500">Overdue</span>;
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(h / 24);
  const color = d < 1 ? 'text-red-500' : d < 3 ? 'text-amber-500' : 'text-gray-400';
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${color}`}>
      <Clock className="h-3 w-3" />
      {d > 0 ? `${d}d left` : `${h}h left`}
    </span>
  );
};

/* Single assignment card */
const AssignmentCard = ({ asgn }) => {
  const done   = asgn.attemptsUsed > 0;
  const overdue = asgn.isOverdue;
  const diff = asgn.quiz?.difficulty;
  const diffColor = diff === 'easy' ? 'text-green-600 dark:text-green-400' : diff === 'hard' ? 'text-red-500 dark:text-red-400' : 'text-amber-600 dark:text-amber-400';

  return (
    <div className={`bg-white dark:bg-gray-900 border rounded-xl overflow-hidden flex flex-col ${
      overdue ? 'border-red-200 dark:border-red-900/60'
      : done   ? 'border-green-200 dark:border-green-900/60'
               : 'border-gray-200 dark:border-gray-800'
    }`}>
      {/* Batch colour strip */}
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: asgn.batch?.color || '#4f46e5' }} />

      <div className="p-5 flex flex-col flex-1">
        {/* Batch label */}
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-1">
          <Layers className="h-3 w-3" /> {asgn.batch?.name || 'Batch'}
        </p>

        {/* Title + status icon */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug flex-1">
            {asgn.title || asgn.quiz?.title}
          </h3>
          {done    && <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />}
          {overdue && !done && <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 dark:text-gray-500 mb-3">
          {diff && <span className={`font-medium capitalize ${diffColor}`}>{diff}</span>}
          {asgn.quiz?.category && <span>{asgn.quiz.category}</span>}
          {asgn.quiz?.timeLimit > 0 && (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{asgn.quiz.timeLimit}m</span>
          )}
          {asgn.dueDate && <TimeLeft dueDate={asgn.dueDate} />}
        </div>

        {/* Attempts remaining */}
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="text-gray-400 dark:text-gray-500">
            {asgn.attemptsLeft} of {asgn.maxAttempts} attempt{asgn.maxAttempts !== 1 ? 's' : ''} remaining
          </span>
          {done && asgn.lastScore !== null && (
            <span className={`font-semibold ${asgn.lastScore >= 70 ? 'text-green-600 dark:text-green-400' : asgn.lastScore >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
              Last: {asgn.lastScore}%
            </span>
          )}
        </div>

        {/* Instructions */}
        {asgn.instructions && (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-3 line-clamp-2 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
            {asgn.instructions}
          </p>
        )}

        {/* CTA */}
        <div className="mt-auto pt-2">
          {asgn.canAttempt ? (
            <Link
              to={`/quiz/${asgn.quiz?._id}`}
              className="flex items-center justify-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {done ? 'Retake quiz' : 'Start quiz'} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <div className="flex items-center justify-center gap-1.5 py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-sm rounded-lg cursor-not-allowed">
              <XCircle className="h-4 w-4" /> No attempts left
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main page ───────────────────────────────────────────────────────────── */
const MyClasses = () => {
  const { currentUser }    = useContext(AuthContext);
  const { org }            = useOrg();
  const navigate           = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [batches,     setBatches]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState('pending');

  useEffect(() => {
    // Only fetch if user has an org
    if (!currentUser?.orgId) { setLoading(false); return; }
    Promise.all([
      api.get('/org/my-assignments'),
      api.get('/org/batches'),
    ]).then(([a, b]) => {
      setAssignments(a.data.assignments || []);
      setBatches(b.data.batches || []);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser?.orgId]);

  const pending   = assignments.filter(a => a.attemptsUsed === 0 && !a.isOverdue && a.canAttempt);
  const completed = assignments.filter(a => a.attemptsUsed > 0);
  const overdue   = assignments.filter(a => a.isOverdue && a.attemptsUsed === 0);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh] bg-white dark:bg-gray-950">
      <Loader className="animate-spin h-6 w-6 text-indigo-500" />
    </div>
  );

  /* User hasn't joined any organisation */
  if (!currentUser?.orgId) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl mb-5">
            <Building2 className="h-7 w-7 text-indigo-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Join an organisation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Ask your teacher or admin for the 6-character invite code to access your class assignments.
          </p>
          <Link to="/org/join"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
            Join with invite code <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-7">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Classes</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {org ? <span>Quizzes assigned by <span className="font-medium text-gray-700 dark:text-gray-300">{org.name}</span></span> : 'Your assigned quizzes'}
            </p>
          </div>
          {/* Link to explore more quizzes */}
          <Link to="/quizzes"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Explore all quizzes →
          </Link>
        </div>

        {/* Enrolled batches */}
        {batches.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {batches.map(b => (
              <div key={b._id}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full text-sm">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color || '#4f46e5' }} />
                <span className="text-gray-700 dark:text-gray-300 font-medium">{b.name}</span>
                {b.assignmentCount !== undefined && (
                  <span className="text-gray-400 text-xs">{b.assignmentCount} quiz{b.assignmentCount !== 1 ? 'zes' : ''}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {assignments.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Pending',   value: pending.length,   color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Completed', value: completed.length, color: 'text-green-600 dark:text-green-400' },
              { label: 'Overdue',   value: overdue.length,   color: 'text-red-600 dark:text-red-400' },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* No assignments yet */}
        {assignments.length === 0 && (
          <div className="text-center py-20 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
            <Layers className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No assignments yet</h3>
            <p className="text-sm text-gray-400">
              {batches.length > 0
                ? "Your teacher hasn't assigned any quizzes yet. Check back soon."
                : 'Ask your org admin to add you to a batch.'}
            </p>
            <Link to="/quizzes" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
              <BookOpen className="h-4 w-4" /> Browse open quizzes
            </Link>
          </div>
        )}

        {/* Tabs + assignment grid */}
        {assignments.length > 0 && (
          <>
            <div className="flex border-b border-gray-200 dark:border-gray-800">
              {[
                ['pending',   `Pending (${pending.length})`],
                ['completed', `Completed (${completed.length})`],
                ['overdue',   `Overdue (${overdue.length})`],
              ].map(([key, label]) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === key
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {(() => {
              const list = activeTab === 'pending' ? pending : activeTab === 'completed' ? completed : overdue;
              if (list.length === 0) {
                return (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    {activeTab === 'pending'   ? '🎉 All caught up! No pending quizzes.' :
                     activeTab === 'completed' ? 'No completed quizzes yet — start one above.' :
                                                 'No overdue quizzes. Keep it up!'}
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map(a => <AssignmentCard key={a._id} asgn={a} />)}
                </div>
              );
            })()}
          </>
        )}

      </div>
    </div>
  );
};

export default MyClasses;
