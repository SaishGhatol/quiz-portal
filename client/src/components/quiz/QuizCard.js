import React from 'react';
import { Link } from 'react-router-dom';

const QuizCard = ({ quiz }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-800">{quiz.title}</h3>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getDifficultyColor(quiz.difficulty)}`}>
            {quiz.difficulty}
          </span>
        </div>
        <p className="text-gray-600 mb-4">{quiz.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">{quiz.questions?.length || 0} questions</span>
          <Link 
            to={`/quiz/${quiz._id}`}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300"
          >
            Start Quiz
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuizCard;