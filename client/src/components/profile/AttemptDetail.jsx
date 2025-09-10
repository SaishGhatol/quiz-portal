import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Loader, AlertTriangle, ArrowLeft, Award, CheckCircle2, XCircle, Clock, ChevronDown, BarChart3, Repeat, SearchX, Lightbulb } from 'lucide-react';

const AttemptDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});

  useEffect(() => {
    const fetchAttemptDetail = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/attempts/${id}`);
        setData(response.data);
        setError(null);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to load attempt details.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchAttemptDetail();
  }, [id]);

  const toggleExplanation = (questionId) => {
    setExpandedQuestions(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader className="animate-spin h-8 w-8 text-gray-500"/></div>;
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-500/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Results</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to="/my-attempts" className="inline-flex items-center gap-2 px-5 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors">
            <ArrowLeft size={16} /> Back to My Attempts
          </Link>
        </div>
      </div>
    );
  }

  if (!data || !data.attempt) {
     return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <SearchX className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Attempt Not Found</h3>
          <p className="text-gray-500 mb-6">We couldn't find any data for this quiz attempt.</p>
           <Link to="/my-attempts" className="inline-flex items-center gap-2 px-5 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors">
            <ArrowLeft size={16} /> Back to My Attempts
          </Link>
        </div>
      </div>
    );
  }

  const { attempt, quiz } = data;
  const scorePercentage = attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;
  const timeTakenMs = new Date(attempt.completedAt) - new Date(attempt.startedAt);
  const correctAnswersCount = attempt.answers.filter(a => a.isCorrect).length;
  const isPassed = scorePercentage >= (quiz.passScore || 0);

  const formatTime = (ms) => {
    if (isNaN(ms) || ms < 0) return 'N/A';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };
  
  const getOptionText = (questionId, optionId) => {
    const question = quiz.questions.find(q => q._id === questionId);
    if (!question || !question.options) return 'N/A';
    const option = question.options.find(o => o._id === optionId);
    return option ? option.text : 'N/A';
  };
  
  const getCorrectOptionText = (questionId) => {
    const question = quiz.questions.find(q => q._id === questionId);
    if (!question || !question.options) return 'N/A';
    const correctOption = question.options.find(o => o.isCorrect);
    return correctOption ? correctOption.text : 'N/A';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-8">
        <Link to="/my-attempts" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back to My Attempts
        </Link>
        <h1 className="text-4xl font-bold text-white mt-2">{quiz.title}</h1>
        <p className="text-gray-400 mt-1">Completed on {new Date(attempt.completedAt).toLocaleString()}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Summary & Actions */}
        <div className="lg:col-span-1 space-y-6 lg:sticky top-24">
           <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 text-center">
              <div className="relative h-40 w-40 mx-auto">
                <svg className="h-full w-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" strokeWidth="10" fill="none" className="stroke-gray-800" />
                  <circle cx="50" cy="50" r="45" strokeWidth="10" fill="none" className={`transition-all duration-1000 ease-out ${isPassed ? 'stroke-green-500' : 'stroke-red-500'}`} strokeDasharray={`${(scorePercentage * 2.83)} 283`} strokeLinecap="round" transform="rotate(-90 50 50)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white">{scorePercentage}%</span>
                  <span className={`text-sm font-semibold ${isPassed ? 'text-green-400' : 'text-red-400'}`}>{isPassed ? "Passed" : "Failed"}</span>
                </div>
              </div>
              <p className="mt-4 text-lg font-semibold text-white">Score: {attempt.score} / {attempt.maxScore}</p>
           </div>
           <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-2"><p className="text-sm text-gray-400">Correct</p><p className="text-2xl font-bold text-white">{correctAnswersCount}</p></div>
                <div className="text-center p-2"><p className="text-sm text-gray-400">Incorrect</p><p className="text-2xl font-bold text-white">{quiz.questions.length - correctAnswersCount}</p></div>
                <div className="text-center p-2"><p className="text-sm text-gray-400">Time</p><p className="text-2xl font-bold text-white">{formatTime(timeTakenMs)}</p></div>
                <div className="text-center p-2"><p className="text-sm text-gray-400">Points</p><p className="text-2xl font-bold text-white">{attempt.score}</p></div>
              </div>
           </div>
            <div className="flex flex-col gap-3">
               <Link to={`/quiz/${quiz._id}/take`} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
                  <Repeat size={16} /> Retake Quiz
              </Link>
               <Link to="/quizzes" className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                Explore Other Quizzes
              </Link>
           </div>
        </div>
        
        {/* Right Column: Detailed Review */}
        <div className="lg:col-span-2 space-y-4">
           <div className="bg-gray-950 border border-gray-800 rounded-2xl">
              <div className="p-6 border-b border-gray-800"><h2 className="text-xl font-semibold text-white">Detailed Review</h2></div>
              <div className="p-4 space-y-3">
                {quiz.questions.map((question, index) => {
                  const userAnswer = attempt.answers.find(a => a.questionId === question._id);
                  const isCorrect = userAnswer?.isCorrect || false;

                  return (
                    <div key={question._id} className="bg-gray-900 border border-gray-800 rounded-lg">
                      <button onClick={() => toggleExplanation(question._id)} className="w-full flex justify-between items-center text-left p-4">
                        <div className="flex items-start gap-3">
                          {isCorrect ? <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5"/> : <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5"/>}
                          <p className="font-medium text-white">{index + 1}. {question.text}</p>
                        </div>
                        <ChevronDown size={20} className={`text-gray-500 transition-transform ${expandedQuestions[question._id] ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedQuestions[question._id] && (
                        <div className="px-4 pb-4 pl-12 space-y-3 animate-fade-in">
                          <div className={`p-3 rounded-lg flex items-start gap-3 ${isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            {isCorrect ? <CheckCircle2 size={18} className="text-green-400 mt-0.5 flex-shrink-0"/> : <XCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0"/>}
                            <div>
                              <p className="text-sm font-medium text-gray-400">Your Answer</p>
                              <p className="text-white">{userAnswer ? getOptionText(question._id, userAnswer.selectedOptionId) : 'Not Answered'}</p>
                            </div>
                          </div>
                          {!isCorrect && (
                            <div className="p-3 rounded-lg bg-green-500/10 flex items-start gap-3">
                              <CheckCircle2 size={18} className="text-green-400 mt-0.5 flex-shrink-0"/>
                              <div>
                                <p className="text-sm font-medium text-gray-400">Correct Answer</p>
                                <p className="text-white">{getCorrectOptionText(question._id)}</p>
                              </div>
                            </div>
                          )}
                           {question.explanation && (
                             <div className="p-3 rounded-lg bg-yellow-500/10 flex items-start gap-3">
                               <Lightbulb size={18} className="text-yellow-400 mt-0.5 flex-shrink-0"/>
                               <div>
                                 <p className="text-sm font-medium text-gray-400">Explanation</p>
                                 <p className="text-gray-300 text-sm mt-1">{question.explanation}</p>
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
       <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AttemptDetail;

