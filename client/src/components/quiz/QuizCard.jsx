import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Award, HelpCircle } from 'lucide-react';

const QuizCard = ({ quiz }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
      <div className="p-6">
        <div className="flex items-start mb-4">
          <div className="ml-1 flex-1">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 leading-tight">{quiz.title}</h3>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getDifficultyColor(quiz.difficulty)}`}>
                {quiz.difficulty}
              </span>
            </div>
            <span className="text-sm text-gray-500 mt-1">{quiz.category || 'General'}</span>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6 line-clamp-2">{quiz.description}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
          <div className="flex items-center">
            <HelpCircle className="h-4 w-4 mr-1" />
            <span>{quiz.totalQuestions || 0} questions</span>
          </div>
          
          {quiz.estimatedTime && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{quiz.estimatedTime} mins</span>
            </div>
          )}
          
          {quiz.averageRating && (
            <div className="flex items-center">
              <Award className="h-4 w-4 mr-1" />
              <span>{quiz.averageRating}/5</span>
            </div>
          )}
        </div>
        
        <Link 
          to={`/quiz/${quiz._id}`}
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium transition-colors duration-300"
        >
          Start Quiz
        </Link>
      </div>
    </div>
  );
};

export default QuizCard;