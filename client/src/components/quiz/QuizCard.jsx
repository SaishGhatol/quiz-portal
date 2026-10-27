import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, HelpCircle, ArrowRight, Users, RotateCcw, Bookmark } from 'lucide-react';
import { DifficultyBadge } from '../ui/Badge';
import { categoryMeta, scoreTone, TONE_TEXT } from '../../utils/quiz';

/**
 * Whole card is one link (one tab stop). `best` is the user's best % on this quiz,
 * when they have attempted it, so the card can nudge a retake instead of a start.
 */
const QuizCard = ({ quiz, best, saved = false }) => {
  const { icon: Icon, cls } = categoryMeta(quiz.category);
  const attempted = typeof best === 'number';

  return (
    <Link to={`/quiz/${quiz._id}`}
      className="group flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card p-5 hover:border-brand-200 dark:hover:border-brand-500/40 hover:shadow-raised hover:-translate-y-0.5 transition-[transform,box-shadow,border-color] duration-200">

      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{quiz.category || 'General'}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {saved && <Bookmark className="h-4 w-4 text-brand-500 fill-current" aria-label="Saved" />}
          <DifficultyBadge difficulty={quiz.difficulty} />
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 dark:text-white text-[15px] leading-snug line-clamp-2 group-hover:text-brand-700 dark:group-hover:text-brand-300">
        {quiz.title}
      </h3>
      <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 flex-1">
        {quiz.description || 'Test your knowledge with this quiz.'}
      </p>

      <div className="flex items-center gap-3.5 mt-4 text-xs text-gray-500 dark:text-gray-400">
        {quiz.totalQuestions > 0 && (
          <span className="flex items-center gap-1"><HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />{quiz.totalQuestions} Qs</span>
        )}
        {quiz.timeLimit > 0 && (
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{quiz.timeLimit} min</span>
        )}
        {quiz.totalAttempts > 0 && (
          <span className="flex items-center gap-1" title="Total attempts"><Users className="h-3.5 w-3.5" aria-hidden="true" />{quiz.totalAttempts.toLocaleString()}</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        {attempted ? (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Your best <span className={`font-bold tabular-nums ${TONE_TEXT[scoreTone(best)]}`}>{best}%</span>
          </span>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500">Not attempted</span>
        )}
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400">
          {attempted ? <><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Retake</> : <>Start <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" /></>}
        </span>
      </div>
    </Link>
  );
};

export default QuizCard;
