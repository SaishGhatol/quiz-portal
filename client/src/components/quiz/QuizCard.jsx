import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Award, HelpCircle, ArrowRight } from 'lucide-react';
import api from '../../utils/api';

const QuizCard = ({ quiz }) => {
  const [questionCount, setQuestionCount] = useState(0);

  useEffect(() => {
    const fetchQuestionCount = async () => {
      if (quiz?._id) {
        try {
          const { data } = await api.get(`/quizzes/${quiz._id}/questions`);
          setQuestionCount(data.questions.length);
        } catch (err) {
          console.error(`Error fetching questions:`, err);
          setQuestionCount(0);
        }
      }
    };
    fetchQuestionCount();
  }, [quiz]);

  const difficultyConfig = {
    easy: { color: 'bg-emerald-500/15 text-emerald-700', label: 'Easy' },
    medium: { color: 'bg-amber-500/15 text-amber-700', label: 'Medium' },
    hard: { color: 'bg-rose-500/15 text-rose-700',label:"Hard" }
  };

  return (
    <article className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] border border-gray-100 overflow-hidden">
      <div className="absolute inset-0 pattern-dots pattern-gray-200 pattern-bg-transparent pattern-size-2 pattern-opacity-20 -z-0" />
      
      <div className="p-6 space-y-4 relative z-10 bg-white/95 hover:bg-white transition-colors">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-900 tracking-tight">
                {quiz.title}
              </h3>
              <span className={`${difficultyConfig[quiz.difficulty].color} px-2.5 py-1 rounded-full text-xs font-medium border border-current/10`}>
                {difficultyConfig[quiz.difficulty].label}
              </span>
            </div>
            {quiz.category && (
              <span className="inline-block px-2 py-1 bg-indigo-500/10 text-indigo-700 text-xs font-medium rounded-md mb-3">
                {quiz.category}
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
          {quiz.description}
        </p>

        <div className="grid grid-cols-3 gap-4 py-3 border-y border-gray-100">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700">
              {questionCount}
              <span className="text-gray-500 ml-0.5">Questions</span>
            </span>
          </div>
          
          {quiz.estimatedTime && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                {quiz.estimatedTime}
                <span className="text-gray-500 ml-0.5">min</span>
              </span>
            </div>
          )}
          
        
        </div>

        <Link 
          to={`/quiz/${quiz._id}`}
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-semibold py-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Start Challenge
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Hover effect background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
    </article>
  );
};

export default QuizCard;