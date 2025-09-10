import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, HelpCircle, ArrowRight, BookOpen } from 'lucide-react';

// A small, reusable Tag component for displaying category or difficulty.
const Tag = ({ text, icon: Icon, className = '' }) => (
  <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${className}`}>
    {Icon && <Icon size={12} />}
    <span>{text}</span>
  </div>
);

// Define default quiz data outside the component for cleaner code.
const defaultQuiz = {
  _id: 'default-id',
  title: 'Discover Your Next Challenge',
  description: 'Explore a wide variety of topics designed to test your knowledge and help you learn.',
  difficulty: 'medium',
  category: 'General',
  estimatedTime: 10,
  questionCount: 15,
};

// Use default parameter for props instead of `defaultProps`.
const QuizCard = ({ quiz = defaultQuiz }) => {
  const navigate = useNavigate();
  const cardRef = useRef(null);

  // Mouse-tracking spotlight effect logic
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  // Navigate to the take quiz page (for the button)
  const handleStartChallenge = (e) => {
    e.preventDefault(); // Prevent the parent Link from navigating
    e.stopPropagation(); // Stop the event from bubbling up
    navigate(`/quiz/${quiz._id}/take`);
  };

  // Configuration for difficulty styles
  const difficultyConfig = {
    easy: { label: 'Easy', className: 'border-green-500/30 bg-green-500/10 text-green-400' },
    medium: { label: 'Medium', className: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' },
    hard: { label: 'Hard', className: 'border-red-500/30 bg-red-500/10 text-red-400' },
    default: { label: 'N/A', className: 'border-gray-500/30 bg-gray-500/10 text-gray-400' }
  };
  
  const { label: diffLabel, className: diffClassName } = difficultyConfig[quiz.difficulty] || difficultyConfig.default;
  const questionCount = quiz.questionCount || 0;

  return (
    // ENHANCEMENT: Replaced div with Link for better accessibility.
    <Link
      to={`/quiz/${quiz._id}`}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className="group relative block h-full w-full transform transition-transform duration-300 ease-out hover:-translate-y-2"
    >
      {/* --- Aurora Border Effect --- */}
      <div
        className="absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-70
                   before:absolute before:inset-0 before:rounded-2xl 
                   before:bg-[radial-gradient(500px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(255,255,255,0.1),transparent_80%)] 
                   pointer-events-none"
        aria-hidden="true"
      />

      {/* --- Rebuilt with Flexbox for stable height --- */}
      <article className="relative h-full flex flex-col bg-gray-950 border border-gray-800 rounded-xl p-6">
        {/* This div will grow to fill available space, pushing the footer down */}
        <div className="flex-grow">
          <div className="flex items-center justify-between gap-4 mb-3">
             <Tag text={quiz.category} icon={BookOpen} className="border-blue-500/30 bg-blue-500/10 text-blue-400" />
             <Tag text={diffLabel} className={diffClassName} />
          </div>
          <h3 className="text-xl font-semibold text-white tracking-tight my-4">
            {quiz.title}
          </h3>
          {/* Added min-h to prevent layout shifts with short descriptions */}
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-4 min-h-[60px]">
            {quiz.description}
          </p>
        </div>

        {/* This footer content will now be perfectly aligned at the bottom of the card */}
        <div>
          <div className="flex items-center justify-between py-4 border-y border-gray-800 text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <HelpCircle className="h-4 w-4" />
              <span className="font-medium text-gray-300">{questionCount} Questions</span>
            </div>
            {quiz.estimatedTime > 0 && (
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="h-4 w-4" />
                <span className="font-medium text-gray-300">{quiz.estimatedTime} min</span>
              </div>
            )}
          </div>
          <button
            onClick={handleStartChallenge}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-white text-black 
                       text-sm font-semibold py-3 rounded-lg transition-all duration-300
                       shadow-[0_0_20px_rgba(255,255,255,0)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]
                       hover:!bg-gray-200"
          >
            Start Challenge
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </article>
    </Link>
  );
};

export default QuizCard;