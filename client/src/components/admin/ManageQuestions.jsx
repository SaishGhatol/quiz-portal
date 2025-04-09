import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const ManageQuestions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctOption: 0,
    points: 1
  });
  const [editing, setEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);

  useEffect(() => {
    fetchQuizWithQuestions();
  }, [id]);

  const fetchQuizWithQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/quizzes/${id}/questions`);
      setQuiz(response.data.quiz);
      setQuestions(response.data.questions || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching quiz data:', error);
      setError('Failed to load quiz data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionChange = (e) => {
    setCurrentQuestion({
      ...currentQuestion,
      text: e.target.value
    });
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = value;
    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions
    });
  };

  const handleCorrectOptionChange = (e) => {
    setCurrentQuestion({
      ...currentQuestion,
      correctOption: parseInt(e.target.value)
    });
  };

  const handlePointsChange = (e) => {
    setCurrentQuestion({
      ...currentQuestion,
      points: parseInt(e.target.value) || 1
    });
  };

  const resetForm = () => {
    setCurrentQuestion({
      text: '',
      options: ['', '', '', ''],
      correctOption: 0,
      points: 1
    });
    setEditing(false);
    setEditIndex(-1);
  };

  const editQuestion = (index) => {
    const question = questions[index];
    setCurrentQuestion({
      text: question.text,
      options: [...question.options],
      correctOption: question.correctOption,
      points: question.points || 1
    });
    setEditing(true);
    setEditIndex(index);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!currentQuestion.text.trim()) {
      toast.error('Question text is required');
      return;
    }
    
    if (currentQuestion.options.some(option => !option.trim())) {
      toast.error('All options must be filled out');
      return;
    }
    
    try {
      if (editing) {
        // Update existing question
        await api.put(`/quizzes/${id}/questions/${questions[editIndex]._id}`, currentQuestion);
        const updatedQuestions = [...questions];
        updatedQuestions[editIndex] = { ...currentQuestion, _id: questions[editIndex]._id };
        setQuestions(updatedQuestions);
        toast.success('Question updated successfully');
      } else {
        // Add new question
        const response = await api.post(`/quizzes/${id}/questions`, currentQuestion);
        setQuestions([...questions, response.data.question]);
        toast.success('Question added successfully');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error(error.response?.data?.message || 'Failed to save question');
    }
  };

  const deleteQuestion = async (questionId, index) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    
    try {
      await api.delete(`/quizzes/${id}/questions/${questionId}`);
      const updatedQuestions = questions.filter((_, i) => i !== index);
      setQuestions(updatedQuestions);
      toast.success('Question deleted successfully');
      
      if (editing && editIndex === index) {
        resetForm();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const reorderQuestion = async (questionId, direction) => {
    try {
      await api.put(`/quizzes/${id}/questions/${questionId}/reorder`, { direction });
      fetchQuizWithQuestions(); // Refresh questions
      toast.success('Question reordered successfully');
    } catch (error) {
      console.error('Error reordering question:', error);
      toast.error('Failed to reorder question');
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading quiz questions...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Manage Questions: {quiz?.title}
        </h1>
        <button
          onClick={() => navigate('/admin/quizzes')}
          className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded"
        >
          Back to Quizzes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Question Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Question' : 'Add New Question'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="questionText" className="block text-gray-700 text-sm font-bold mb-2">Question</label>
              <textarea
                id="questionText"
                value={currentQuestion.text}
                onChange={handleQuestionChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Options</label>
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="radio"
                    id={`option${index}`}
                    name="correctOption"
                    value={index}
                    checked={currentQuestion.correctOption === index}
                    onChange={handleCorrectOptionChange}
                    className="mr-2"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                </div>
              ))}
              <p className="text-sm text-gray-500 mt-1">Select the radio button for the correct answer</p>
            </div>

            <div className="mb-6">
              <label htmlFor="points" className="block text-gray-700 text-sm font-bold mb-2">Points</label>
              <input
                type="number"
                id="points"
                value={currentQuestion.points}
                onChange={handlePointsChange}
                min="1"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="flex items-center justify-between">
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {editing ? 'Save Changes' : 'Add Question'}
              </button>
            </div>
          </form>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Current Questions ({questions.length})</h2>
          
          {questions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No questions added yet.</p>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={index} className="border rounded p-4 relative">
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button 
                      onClick={() => editQuestion(index)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteQuestion(question._id, index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                    {index > 0 && (
                      <button 
                        onClick={() => reorderQuestion(question._id, 'up')}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ↑
                      </button>
                    )}
                    {index < questions.length - 1 && (
                      <button 
                        onClick={() => reorderQuestion(question._id, 'down')}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ↓
                      </button>
                    )}
                  </div>
                  
                  <p className="font-bold mb-2">{index + 1}. {question.text}</p>
                  
                  <div className="pl-4">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center">
                        <span className={`w-4 h-4 inline-block mr-2 ${
                          optIndex === question.correctOption ? 'text-green-500' : 'text-gray-400'
                        }`}>
                          {optIndex === question.correctOption ? '✓' : '○'}
                        </span>
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-500">
                    Points: {question.points || 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageQuestions;