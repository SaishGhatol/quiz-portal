import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { Loader, AlertTriangle, ArrowLeft, CheckCircle2, XCircle, Clock, ChevronDown, Repeat, SearchX, Lightbulb } from 'lucide-react';

const AttemptDetail = () => {
  const { id } = useParams();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    api.get(`/attempts/${id}`)
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load attempt.'))
      .finally(() => setLoading(false));
  }, [id]);

  const toggle = id => setExpanded(p => ({ ...p, [id]: !p[id] }));

  if (loading) return <div className="flex justify-center items-center min-h-[50vh] bg-white dark:bg-gray-950"><Loader className="animate-spin h-6 w-6 text-indigo-500" /></div>;

  if (error) return (
    <div className="min-h-[50vh] bg-white dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <Link to="/my-attempts" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">← Back</Link>
      </div>
    </div>
  );

  if (!data?.attempt) return (
    <div className="min-h-[50vh] bg-white dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <SearchX className="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Attempt not found.</p>
        <Link to="/my-attempts" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">← Back</Link>
      </div>
    </div>
  );

  const { attempt, quiz } = data;
  const pct     = attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;
  const passed  = pct >= (quiz.passScore || 40);
  const correct = attempt.answers.filter(a => a.isCorrect).length;
  const ms      = new Date(attempt.completedAt) - new Date(attempt.startedAt);
  const fmtTime = ms => isNaN(ms) || ms < 0 ? 'N/A' : `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;

  const optionText  = (qid, oid) => quiz.questions?.find(q => q._id === qid)?.options?.find(o => o._id === oid)?.text || 'N/A';
  const correctText = qid => quiz.questions?.find(q => q._id === qid)?.options?.find(o => o.isCorrect)?.text || 'N/A';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        <div className="mb-6">
          <Link to="/my-attempts" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> My Attempts
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Completed {new Date(attempt.completedAt).toLocaleString()}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Score sidebar */}
          <div className="space-y-4 lg:sticky top-20 self-start">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center">
              <div className="relative w-32 h-32 mx-auto mb-3">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" strokeWidth="10" fill="none" className="stroke-gray-100 dark:stroke-gray-800" />
                  <circle cx="50" cy="50" r="45" strokeWidth="10" fill="none"
                    className={passed ? 'stroke-green-500' : 'stroke-red-400'}
                    strokeDasharray={`${pct * 2.83} 283`} strokeLinecap="round" transform="rotate(-90 50 50)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{pct}%</span>
                  <span className={`text-xs font-semibold ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    {passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400">{attempt.score} / {attempt.maxScore} points</p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Correct',   value: correct },
                  { label: 'Incorrect', value: (quiz.questions?.length || 0) - correct },
                  { label: 'Time',      value: fmtTime(ms) },
                  { label: 'Total',     value: quiz.questions?.length || 0 },
                ].map((s, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                    <p className="font-bold text-gray-900 dark:text-white">{s.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <Link to={`/quiz/${quiz._id}/take`}
              className="flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors w-full">
              <Repeat className="h-4 w-4" /> Retake Quiz
            </Link>
          </div>

          {/* Answers */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white">Detailed Review</h2>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {quiz.questions?.map((q, idx) => {
                const ans  = attempt.answers.find(a => a.questionId === q._id);
                const ok   = ans?.isCorrect || false;
                const open = !!expanded[q._id];
                return (
                  <div key={q._id}>
                    <button onClick={() => toggle(q._id)}
                      className="w-full flex items-start justify-between gap-3 px-5 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-start gap-3">
                        {ok ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            : <XCircle      className="h-5 w-5 text-red-400  shrink-0 mt-0.5" />}
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          <span className="text-gray-400 mr-1">{idx + 1}.</span>{q.text}
                        </p>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 mt-1 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && (
                      <div className="px-5 pb-4 pl-14 space-y-2">
                        <div className={`p-3 rounded-lg flex items-start gap-3 ${ok ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                          {ok ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                              : <XCircle      className="h-4 w-4 text-red-400  shrink-0 mt-0.5" />}
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Your answer</p>
                            <p className="text-sm text-gray-900 dark:text-white">{ans ? optionText(q._id, ans.selectedOptionId) : 'Not answered'}</p>
                          </div>
                        </div>
                        {!ok && (
                          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-start gap-3">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">Correct answer</p>
                              <p className="text-sm text-gray-900 dark:text-white">{correctText(q._id)}</p>
                            </div>
                          </div>
                        )}
                        {q.explanation && (
                          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 flex items-start gap-3">
                            <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">Explanation</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{q.explanation}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttemptDetail;
