import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, HelpCircle, ArrowRight } from 'lucide-react';

const DIFF = {
  easy:   { label: 'Easy',   cls: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20' },
  medium: { label: 'Medium', cls: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' },
  hard:   { label: 'Hard',   cls: 'text-red-700   dark:text-red-400   bg-red-50   dark:bg-red-900/20'   },
};

const QuizCard = ({ quiz }) => {
  const diff = DIFF[(quiz.difficulty || '').toLowerCase()] || DIFF.medium;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
      <div className="flex flex-col flex-1 p-5">

        {/* Badges row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${diff.cls}`}>
            {diff.label}
          </span>
          {quiz.category && (
            <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[120px]">
              {quiz.category}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-snug mb-2 line-clamp-2">
          {quiz.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-1 line-clamp-3 mb-4">
          {quiz.description || 'Test your knowledge with this quiz.'}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-4">
          {quiz.totalQuestions > 0 && (
            <span className="flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5" />
              {quiz.totalQuestions} questions
            </span>
          )}
          {quiz.timeLimit > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {quiz.timeLimit} min
            </span>
          )}
        </div>

        {/* CTA */}
        <Link
          to={`/quiz/${quiz._id}`}
          className="flex items-center justify-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Start quiz <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default QuizCard;
