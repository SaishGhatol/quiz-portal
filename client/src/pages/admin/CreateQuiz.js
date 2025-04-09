import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'medium',
    timeLimit: 30,
    passScore: 70,
    isActive: true
  });
  
  const [questions, setQuestions] = useState([
    {
      text: '',
      options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }],
      type: 'single',
      points: 1,
      explanation: ''
    }
  ]);

  const handleQuizChange = (e) => {
    const { name, value, type, checked } = e.target;
    setQuizData({
      ...quizData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (questionIndex, optionIndex, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex][field] = value;
    setQuestions(updatedQuestions);
  };

  const handleCorrectAnswerChange = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    const questionType = updatedQuestions[questionIndex].type;
    
    // For single and truefalse, only one option can be correct
    if (questionType === 'single' || questionType === 'truefalse') {
      updatedQuestions[questionIndex].options.forEach((option, i) => {
        option.isCorrect = i === optionIndex;
      });
    } else {
      // For multiple choice, toggle the current option
      updatedQuestions[questionIndex].options[optionIndex].isCorrect = 
        !updatedQuestions[questionIndex].options[optionIndex].isCorrect;
    }
    
    setQuestions(updatedQuestions);
  };

  const handleAddOption = (questionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.push({ text: '', isCorrect: false });
    setQuestions(updatedQuestions);
  };

  const handleRemoveOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options.length > 2) {
      updatedQuestions[questionIndex].options.splice(optionIndex, 1);
      setQuestions(updatedQuestions);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }],
        type: 'single',
        points: 1,
        explanation: ''
      }
    ]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length > 1) {
      const updatedQuestions = [...questions];
      updatedQuestions.splice(index, 1);
      setQuestions(updatedQuestions);
    }
  };

  const handleQuestionTypeChange = (index, type) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].type = type;
    
    // Reset options based on type
    if (type === 'truefalse') {
      updatedQuestions[index].options = [
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: false }
      ];
    } else if (type === 'text') {
      // For text questions, we store the correct answer as the first option
      updatedQuestions[index].options = [{ text: '', isCorrect: true }];
    }
    
    setQuestions(updatedQuestions);
  };

  const validateQuiz = () => {
    // Check quiz basic info
    if (!quizData.title || !quizData.description || !quizData.category) {
      setError('Please complete all quiz information fields');
      return false;
    }
    
    // Check questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (!question.text) {
        setError(`Question ${i + 1} is missing text`);
        return false;
      }
      
      // Check options
      if (question.type !== 'text') {
        let hasCorrectOption = question.options.some(opt => opt.isCorrect);
        
        if (!hasCorrectOption) {
          setError(`Question ${i + 1} doesn't have any correct answer selected`);
          return false;
        }
        
        for (let j = 0; j < question.options.length; j++) {
          if (!question.options[j].text) {
            setError(`Question ${i + 1}, Option ${j + 1} is missing text`);
            return false;
          }
        }
      } else if (question.type === 'text' && !question.options[0].text) {
        setError(`Question ${i + 1} is missing the correct answer text`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate quiz data
    if (!validateQuiz()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Create quiz
      const quizResponse = await api.post('/quizzes', quizData);
      const quizId = quizResponse.data.quiz._id;
      
      // Add questions to the quiz
      for (const question of questions) {
        await api.post('/questions', {
          ...question,
          quizId
        });
      }
      
      setSuccess('Quiz created successfully!');
      
      // Navigate to quiz management after a short delay
      setTimeout(() => {
        navigate('/admin/quizzes');
      }, 1500);
      
    } catch (err) {
      setError('Failed to create quiz: ' + (err.response?.data?.message || 'Unknown error'));
      console.error('Error creating quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Quiz</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quiz Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Quiz Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={quizData.title}
                onChange={handleQuizChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                name="category"
                value={quizData.category}
                onChange={handleQuizChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={quizData.description}
                onChange={handleQuizChange}
                className="w-full px-3 py-2 border rounded-md"
                rows="3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                name="difficulty"
                value={quizData.difficulty}
                onChange={handleQuizChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (minutes)</label>
              <input
                type="number"
                name="timeLimit"
                value={quizData.timeLimit}
                onChange={handleQuizChange}
                className="w-full px-3 py-2 border rounded-md"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
              <input
                type="number"
                name="passScore"
                value={quizData.passScore}
                onChange={handleQuizChange}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
                max="100"
                required
              />
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={quizData.isActive}
                  onChange={handleQuizChange}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Questions</h2>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Add Question
            </button>
          </div>

          {questions.map((question, questionIndex) => (
            <div key={questionIndex} className="border rounded-md p-4 mb-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium">Question {questionIndex + 1}</h3>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(questionIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove Question
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                  <input
                    type="text"
                    value={question.text}
                    onChange={(e) => handleQuestionChange(questionIndex, 'text', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                  <select
                    value={question.type}
                    onChange={(e) => handleQuestionTypeChange(questionIndex, e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="single">Single Choice</option>
                    <option value="multiple">Multiple Choice</option>
                    <option value="truefalse">True/False</option>
                    <option value="text">Text Answer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                  <input
                    type="number"
                    value={question.points}
                    onChange={(e) => handleQuestionChange(questionIndex, 'points', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                  <textarea
                    value={question.explanation}
                    onChange={(e) => handleQuestionChange(questionIndex, 'explanation', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    rows="2"
                  />
                </div>

                {/* Options Section */}
                {question.type !== 'text' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-medium">Options</h4>
                      <button
                        type="button"
                        onClick={() => handleAddOption(questionIndex)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Add Option
                      </button>
                    </div>

                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-4">
                        <input
                          type={question.type === 'multiple' ? 'checkbox' : 'radio'}
                          checked={option.isCorrect}
                          onChange={() => handleCorrectAnswerChange(questionIndex, optionIndex)}
                          className="rounded"
                        />
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => handleOptionChange(questionIndex, optionIndex, 'text', e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-md"
                          required
                        />
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(questionIndex, optionIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Text Answer Input */}
                {question.type === 'text' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                    <input
                      type="text"
                      value={question.options[0].text}
                      onChange={(e) => handleOptionChange(questionIndex, 0, 'text', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/quizzes')}
            className="px-4 py-2 border rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuiz;