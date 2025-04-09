import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const TakeQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const [quizResponse, questionsResponse] = await Promise.all([
          api.get(`/quizzes/${id}`),
          api.get(`/quizzes/${id}/questions`)
        ]);

        setQuiz(quizResponse.data);
        setQuestions(questionsResponse.data);
        setTimeLeft(quizResponse.data.timeLimit * 60); // Convert minutes to seconds
        setAnswers(questionsResponse.data.map(() => ({
          selectedAnswer: null,
          isAnswered: false
        })));
      } catch (err) {
        setError('Failed to load quiz. Please try again later.');
        console.error('Error fetching quiz:', err);
      }
    };

    fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      handleSubmitQuiz();
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer) => {
    const newAnswers = [...answers];
    const currentAnswer = newAnswers[currentQuestionIndex];
    
    if (questions[currentQuestionIndex].type === 'multiple') {
      if (!currentAnswer.selectedAnswer) {
        currentAnswer.selectedAnswer = [];
      }
      const index = currentAnswer.selectedAnswer.indexOf(answer);
      if (index === -1) {
        currentAnswer.selectedAnswer.push(answer);
      } else {
        currentAnswer.selectedAnswer.splice(index, 1);
      }
    } else {
      currentAnswer.selectedAnswer = answer;
    }
    
    currentAnswer.isAnswered = true;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await api.post(`/quizzes/${id}/submit`, {
        answers: answers.map(answer => answer.selectedAnswer)
      });
      
      navigate(`/quiz/${id}/results/${response.data.attemptId}`);
    } catch (err) {
      setError('Failed to submit quiz. Please try again.');
      console.error('Error submitting quiz:', err);
      setIsSubmitting(false);
    }
  };

  if (!quiz || !questions.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          {error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <div>Loading quiz...</div>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Quiz header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-lg font-semibold">
            Time Left: {formatTime(timeLeft)}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm">
          <div><span className="font-semibold">Category:</span> {quiz.category}</div>
          <div><span className="font-semibold">Difficulty:</span> {quiz.difficulty}</div>
          <div><span className="font-semibold">Questions:</span> {questions.length}</div>
          <div><span className="font-semibold">Pass Score:</span> {quiz.passScore}%</div>
        </div>
        
        {/* Question navigation progress */}
        <div className="mt-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-semibold">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm">
              {answers.filter(a => a.isAnswered).length} of {questions.length} answered
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-500 h-2.5 rounded-full"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Question card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Question {currentQuestionIndex + 1}:</h2>
        <p className="text-lg mb-6">{currentQuestion.text}</p>
        
        {/* Question options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.type === 'multiple' ? (
            // Multiple choice (checkboxes)
            currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="checkbox"
                  id={`option-${index}`}
                  className="w-5 h-5 text-blue-600"
                  checked={(currentAnswer.selectedAnswer || []).includes(option.text)}
                  onChange={() => handleAnswerSelect(option.text)}
                />
                <label htmlFor={`option-${index}`} className="ml-2 text-gray-700">
                  {option.text}
                </label>
              </div>
            ))
          ) : currentQuestion.type === 'truefalse' ? (
            // True/False question
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="true"
                  name="truefalse"
                  className="w-5 h-5 text-blue-600"
                  checked={currentAnswer.selectedAnswer === 'True'}
                  onChange={() => handleAnswerSelect('True')}
                />
                <label htmlFor="true" className="ml-2 text-gray-700">True</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="false"
                  name="truefalse"
                  className="w-5 h-5 text-blue-600"
                  checked={currentAnswer.selectedAnswer === 'False'}
                  onChange={() => handleAnswerSelect('False')}
                />
                <label htmlFor="false" className="ml-2 text-gray-700">False</label>
              </div>
            </div>
          ) : currentQuestion.type === 'text' ? (
            // Text input question
            <div>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Type your answer here..."
                value={currentAnswer.selectedAnswer || ''}
                onChange={(e) => handleAnswerSelect(e.target.value)}
              />
            </div>
          ) : (
            // Single choice (radio buttons)
            currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="radio"
                  id={`option-${index}`}
                  name="singleChoice"
                  className="w-5 h-5 text-blue-600"
                  checked={currentAnswer.selectedAnswer === option.text}
                  onChange={() => handleAnswerSelect(option.text)}
                />
                <label htmlFor={`option-${index}`} className="ml-2 text-gray-700">
                  {option.text}
                </label>
              </div>
            ))
          )}
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            className={`px-4 py-2 rounded ${
              currentQuestionIndex === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Previous
          </button>
          
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={handleNextQuestion}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>
      
      {/* Question navigation buttons */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Question Navigation</h3>
        <div className="grid grid-cols-10 gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-full p-2 rounded ${
                index === currentQuestionIndex
                  ? 'bg-blue-500 text-white'
                  : answers[index]?.isAnswered
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TakeQuiz;