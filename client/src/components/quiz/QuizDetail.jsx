import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import AuthContext from '../../contexts/AuthContext';
import { Loader, AlertTriangle, ArrowLeft, Play, Info, BookOpen, Clock, HelpCircle, Target, SearchX } from 'lucide-react';

const DIFF = {
  easy:   { label: 'Easy',   cls: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' },
  medium: { label: 'Medium', cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800' },
  hard:   { label: 'Hard',   cls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' },
};

const QuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [quiz,          setQuiz]          = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [qRes, qqRes] = await Promise.all([
          api.get(`/quizzes/${id}`),
          api.get(`/quizzes/${id}/questions`),
        ]);
        setQuiz(qRes.data.quiz);
        setQuestionCount(qqRes.data.questions?.length || 0);
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to load quiz.';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] bg-white dark:bg-gray-950">
      <Loader className="animate-spin h-7 w-7 text-indigo-500 mb-3" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading quiz…</p>
    </div>
  );

  if (error) return (
    <div className="min-h-[50vh] bg-white dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <h2 className="font-bold text-gray-900 dark:text-white mb-2">Could not load quiz</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{error}</p>
        <Link to="/quizzes" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to quizzes
        </Link>
      </div>
    </div>
  );

  if (!quiz) return (
    <div className="min-h-[50vh] bg-white dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <SearchX className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        <h2 className="font-bold text-gray-900 dark:text-white mb-2">Quiz not found</h2>
        <Link to="/quizzes" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
          Browse quizzes
        </Link>
      </div>
    </div>
  );

  const diff = DIFF[(quiz.difficulty || '').toLowerCase()] || { label: quiz.difficulty, cls: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700' };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Back link */}
        <Link to="/quizzes" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to quizzes
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">

            {/* Title card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-7">
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${diff.cls}`}>
                  {diff.label}
                </span>
                {quiz.category && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">{quiz.category}</span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight mb-3">
                {quiz.title}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{quiz.description}</p>
            </div>

            {/* Quiz stats */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Quiz details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: HelpCircle, label: 'Questions', value: `${questionCount} questions` },
                  { icon: Clock,      label: 'Time limit', value: quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No limit' },
                  { icon: Target,     label: 'Pass score', value: quiz.passScore ? `${quiz.passScore}%` : 'Not set' },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-1.5">
                      <item.icon className="h-4 w-4" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* What to expect */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Before you start</h2>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                {[
                  'Read each question carefully before answering.',
                  'You can navigate back and change answers before submitting.',
                  quiz.timeLimit ? `You have ${quiz.timeLimit} minutes — the quiz auto-submits when time is up.` : 'There is no time limit — take your time.',
                  'Your score is saved and visible in your dashboard.',
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:sticky top-20">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Ready?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {questionCount} question{questionCount !== 1 ? 's' : ''} · {quiz.timeLimit ? `${quiz.timeLimit} min` : 'No time limit'}
              </p>

              {currentUser ? (
                <>
                  <button
                    onClick={() => navigate(`/quiz/${id}/take`)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    <Play className="h-4 w-4" /> Start Quiz
                  </button>
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
                    Your result will be saved automatically.
                  </p>
                </>
              ) : (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4">
                  <Info className="h-4 w-4 text-indigo-500 mb-2" />
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Sign in</Link>{' '}
                    or{' '}
                    <Link to="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">create a free account</Link>{' '}
                    to take this quiz and track your progress.
                  </p>
                </div>
              )}

              <div className="border-t border-gray-100 dark:border-gray-800 mt-5 pt-5 space-y-2 text-xs text-gray-400 dark:text-gray-500">
                {quiz.totalAttempts > 0 && <p>{quiz.totalAttempts} attempt{quiz.totalAttempts !== 1 ? 's' : ''} total</p>}
                {quiz.createdBy?.name && <p>By {quiz.createdBy.name}</p>}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default QuizDetail;
