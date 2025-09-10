import React, {useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import AuthContext from '../../contexts/AuthContext';
import { Loader, AlertTriangle, ArrowLeft, Play, Info, BookOpen, Clock, BarChart3, SearchX } from 'lucide-react';

const QuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);

  useEffect(() => {
    const fetchQuizData = async () => {
      setLoading(true);
      try {
        const [quizRes, questionsRes] = await Promise.all([
          api.get(`/quizzes/${id}`),
          api.get(`/quizzes/${id}/questions`)
        ]);
        setQuiz(quizRes.data.quiz);
        setQuestionCount(questionsRes.data.questions.length);
        setError(null);
      } catch (err) {
        console.error('Error fetching quiz details:', err);
        const errorMessage = err.response?.data?.message || 'Failed to load quiz. It may not exist or an error occurred.';
        setError(errorMessage);
        toast.error(errorMessage, { theme: 'dark' });
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [id]);

  const handleStartQuiz = () => {
    navigate(`/quiz/${id}/take`);
  };

  const difficultyConfig = {
    easy: { label: 'Easy', className: 'border-green-500/50 bg-green-500/10 text-green-400' },
    medium: { label: 'Medium', className: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' },
    hard: { label: 'Hard', className: 'border-red-500/50 bg-red-500/10 text-red-400' },
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
        <Loader className="animate-spin h-8 w-8 mb-4" />
        <p className="font-semibold text-lg">Loading Quiz Details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <div className="mx-auto bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">An Error Occurred</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to="/quizzes" className="inline-flex items-center gap-2 px-5 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors">
            <ArrowLeft size={16} />
            Back to Quizzes
          </Link>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
       <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <div className="mx-auto bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <SearchX className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Quiz Not Found</h3>
          <p className="text-gray-500 mb-6">The quiz you are looking for does not exist or may have been moved.</p>
          <Link to="/quizzes" className="inline-flex items-center gap-2 px-5 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors">
            <ArrowLeft size={16} />
            Browse Other Quizzes
          </Link>
        </div>
      </div>
    );
  }

  const { label: diffLabel, className: diffClassName } = difficultyConfig[quiz.difficulty] || { label: 'N/A', className: 'border-gray-500/50 bg-gray-500/10 text-gray-400' };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Immersive Header */}
      <div className="relative bg-gray-950 border border-gray-800 rounded-2xl p-8 md:p-12 mb-8 overflow-hidden">
         <div className="absolute inset-0 w-full h-full bg-[radial-gradient(#2d2d2d_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none"></div>
         <div className="relative z-10">
            <Link to="/quizzes" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4">
              <ArrowLeft size={16} />
              Back to All Quizzes
            </Link>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${diffClassName} mb-4 block w-fit`}>
              {diffLabel}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">{quiz.title}</h1>
            <p className="mt-4 text-lg text-gray-400 max-w-3xl">{quiz.description}</p>
         </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Quiz Overview</h2>
              {/* Icon-driven metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-3 text-gray-400 mb-2">
                    <BookOpen size={16} /> <span className="text-sm font-medium">Category</span>
                  </div>
                  <p className="font-semibold text-white">{quiz.category || 'Uncategorized'}</p>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-3 text-gray-400 mb-2">
                    <BarChart3 size={16} /> <span className="text-sm font-medium">Questions</span>
                  </div>
                  <p className="font-semibold text-white">{questionCount} items</p>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-3 text-gray-400 mb-2">
                    <Clock size={16} /> <span className="text-sm font-medium">Time Limit</span>
                  </div>
                  <p className="font-semibold text-white">{quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No limit'}</p>
                </div>
              </div>
          </div>
        </div>

        {/* Right Column: Sticky Action Panel */}
        <div className="lg:col-span-1 lg:sticky top-24">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Ready to Start?</h2>
            {currentUser ? (
              <div className="space-y-4">
                <button
                  onClick={handleStartQuiz}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 text-base font-semibold rounded-lg text-black bg-white hover:bg-gray-200 transition-transform duration-200 hover:scale-105"
                >
                  <Play size={18} />
                  Begin Challenge
                </button>
                <p className="text-xs text-gray-500 text-center">Your results will be saved to your dashboard upon completion.</p>
              </div>
            ) : (
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 flex items-start gap-3">
                <Info size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-300">
                    <Link to="/login" state={{ from: location }} className="font-semibold text-white underline hover:text-gray-200">Log in</Link> or <Link to="/register" className="font-semibold text-white underline hover:text-gray-200">sign up</Link> to take this quiz and track your progress.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default QuizDetail;
