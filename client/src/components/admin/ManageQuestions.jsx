import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Loader } from 'lucide-react';

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
      
      // Fetch quiz details
      const quizResponse = await api.get(`/quizzes/${id}`);
      const quiz = quizResponse.data;
      
      // Fetch quiz questions with correct answer information
      const questionsResponse = await api.get(`/quizzes/${id}/questions?withAnswers=true`);
      const questions = questionsResponse.data.questions;
      
      // Transform questions to match component's expected format if necessary
      const formattedQuestions = questions.map(q => ({
        _id: q._id,
        text: q.text || '',
        options: q.options.map(opt => opt.text || opt),
        correctOption: q.options.findIndex(opt => opt.isCorrect) !== -1 ? 
                       q.options.findIndex(opt => opt.isCorrect) : 
                       q.correctOption,
        points: q.points || 1,
        explanation: q.explanation
      }));
      
      setQuiz(quiz);
      setQuestions(formattedQuestions);
      setError(null);
    } catch (error) {
      console.error('Error fetching quiz data:', error);
      
      // Detailed error reporting
      let errorMessage = 'Failed to load quiz data. Please try again.';
      
      if (error.response) {
        console.error(`Server responded with status ${error.response.status}`);
        errorMessage = `Server error (${error.response.status}): ${error.response.data?.message || 'Failed to load quiz data'}`;
      } else if (error.request) {
        console.error("No response received from server");
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        console.error("Error setting up request:", error.message);
        errorMessage = `Request error: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Modified handleSubmit function with totalQuestions update
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
    
    // Transform the question to match your backend's expected format
    const questionData = {
      text: currentQuestion.text,
      options: currentQuestion.options.map((option, index) => ({
        text: option,
        isCorrect: index === currentQuestion.correctOption
      })),
      points: currentQuestion.points || 1,
      type: 'multiple', // Adjust if you have different question types
      quizId: id
    };
    
    console.log('Submitting question data:', questionData);
    
    try {
      let response;
      
      if (editing && editIndex >= 0 && editIndex < questions.length) {
        // Update existing question
        const questionId = questions[editIndex]?._id;
        if (!questionId) {
          toast.error('Question ID is missing. Cannot update.');
          return;
        }
        
        console.log(`Updating question ${questionId} for quiz ${id}`);
        response = await api.put(`/quizzes/${id}/questions/${questionId}`, questionData);
        console.log('Update response:', response.data);
        
        const updatedQuestions = [...questions];
        updatedQuestions[editIndex] = { 
          ...currentQuestion, 
          _id: questionId 
        };
        setQuestions(updatedQuestions);
        toast.success('Question updated successfully');
      } else {
        // Add new question
        console.log(`Adding new question to quiz ${id}`);
        response = await api.post(`/quizzes/${id}/questions`, questionData);
        console.log('Create response:', response.data);
        
        // Assuming the response contains the created question with _id
        const newQuestion = {
          _id: response.data.question?._id || response.data._id,
          text: currentQuestion.text,
          options: [...currentQuestion.options],
          correctOption: currentQuestion.correctOption,
          points: currentQuestion.points
        };
        setQuestions([...questions, newQuestion]);
        toast.success('Question added successfully');
      }
      
      // Fetch the updated quiz with correct totalQuestions count
      const updatedQuizResponse = await api.get(`/quizzes/${id}`);
      setQuiz(updatedQuizResponse.data);
      
      resetForm();
    } catch (error) {
      console.error('Error saving question:', error);
      
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        const errorDetail = error.response.data?.message || error.response.data?.error || error.response.statusText;
        toast.error(`Failed to save: ${errorDetail || 'Server error'}`);
        
        if (error.response.status === 404) {
          toast.error('API endpoint not found. Check quiz ID and API routes.');
        } else if (error.response.status === 401 || error.response.status === 403) {
          toast.error('Authentication error. You may need to log in again.');
        } else if (error.response.status === 400) {
          toast.error('Invalid question format. Check required fields.');
        }
      } else if (error.request) {
        toast.error('Network issue. Please check your connection.');
      } else {
        toast.error(`Error: ${error.message}`);
      }
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
    if (index >= 0 && index < questions.length) {
      const question = questions[index];
      setCurrentQuestion({
        text: question.text || '',
        options: [...(question.options || ['', '', '', ''])],
        correctOption: question.correctOption || 0,
        points: question.points || 1
      });
      setEditing(true);
      setEditIndex(index);
    }
  };

  // Modified deleteQuestion function to update totalQuestions
  const deleteQuestion = async (questionId, index) => {
    if (!questionId) {
      toast.error('Question ID is missing. Cannot delete.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    
    try {
      await api.delete(`/quizzes/${id}/questions/${questionId}`);
      const updatedQuestions = questions.filter((_, i) => i !== index);
      setQuestions(updatedQuestions);
      
      // Fetch updated quiz with correct totalQuestions count
      const updatedQuizResponse = await api.get(`/quizzes/${id}`);
      setQuiz(updatedQuizResponse.data);
      
      toast.success('Question deleted successfully');
      
      if (editing && editIndex === index) {
        resetForm();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      
      if (error.response) {
        toast.error(`Failed to delete: ${error.response?.data?.message || error.response.statusText || 'Server error'}`);
      } else {
        toast.error('Failed to delete question. Please try again.');
      }
    }
  };
  
  const handleExplanationChange = (e) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      explanation: e.target.value,
    }));
  };
  

  const reorderQuestion = async (questionId, direction) => {
    if (!questionId) {
      toast.error('Cannot reorder: Question ID is missing');
      return;
    }
    
    try {
      await api.put(`/quizzes/${id}/questions/${questionId}/reorder`, { direction });
      await fetchQuizWithQuestions(); // Refresh questions with updated order
      toast.success('Question reordered successfully');
    } catch (error) {
      console.error('Error reordering question:', error);
      
      if (error.response) {
        toast.error(`Failed to reorder: ${error.response?.data?.message || error.response.statusText || 'Server error'}`);
      } else {
        toast.error('Failed to reorder question. Please try again.');
      }
    }
  };

  const handleRetry = () => {
    fetchQuizWithQuestions();
  };

  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-white rounded-lg shadow-md">
        <div className="text-center p-10">
          <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your quiz questions...</p>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 max-w-md mx-auto bg-white rounded-xl shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-lg font-medium text-red-600 mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
            <button
              onClick={handleRetry}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/admin/quizzes')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Return to Quizzes
            </button>
          </div>
          <div className="mt-6 text-left bg-gray-100 p-4 rounded-md text-sm text-gray-700 max-h-40 overflow-auto">
            <p className="font-bold mb-2">Debug Information:</p>
            <p>Quiz ID: {id}</p>
            <p>Endpoint: /admin/quizzes/{id}/questions</p>
            <p>If the issue persists, check the API routes configuration or the browser console for more details.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
    {/* Header */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b border-gray-200">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <span>🧠</span>
          {quiz?.title || 'Quiz Questions'}
        </h1>
        <p className="text-gray-600">Manage quiz questions</p>
      </div>
      <button
        onClick={() => navigate('/admin/quizzes')}
        className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
      >
        <span className="mr-2">←</span>
        Back to Quizzes
      </button>
    </div>
  
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Question Form */}
      <div className="lg:col-span-5 bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 h-fit">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 animate-pulse">
            <span className="text-blue-600 font-bold">
              {editing ? "✏️" : "+"}
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            {editing ? 'Edit Question' : 'Add New Question'}
          </h2>
        </div>
  
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="questionText" className="block text-gray-700 font-medium mb-2">
              Question Text
            </label>
            <textarea
              id="questionText"
              value={currentQuestion.text}
              onChange={handleQuestionChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all h-28 resize-none"
              placeholder="Enter your question here..."
              required
            />
          </div>
  
          <div>
            <label className="block text-gray-700 font-medium mb-2">Answer Options</label>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="grid grid-cols-[auto_1fr] gap-3 items-center">
                  <input
                    type="radio"
                    id={`option${index}`}
                    name="correctOption"
                    value={index}
                    checked={currentQuestion.correctOption === index}
                    onChange={handleCorrectOptionChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2 italic">
              Select the radio button next to the correct answer
            </p>
          </div>
  
          <div>
            <label htmlFor="points" className="block text-gray-700 font-medium mb-2">
              Points Value
            </label>
            <div className="flex items-center">
              <input
                type="number"
                id="points"
                value={currentQuestion.points}
                onChange={handlePointsChange}
                min="1"
                max="10"
                className="w-24 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <span className="ml-2 text-gray-600">points</span>
            </div>
          </div>
  
          <div>
            <label htmlFor="explanation" className="block text-gray-700 font-medium mb-2">
              Explanation
            </label>
            <textarea
              id="explanation"
              value={currentQuestion.explanation || ''}
              onChange={handleExplanationChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all h-28 resize-none"
              placeholder="Provide a short explanation or reference (optional)"
            />
          </div>
  
          <div className="flex items-center justify-end pt-4 space-x-3">
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg text-white cursor-pointer ${
                editing
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors`}
            >
              {editing ? 'Save Changes' : 'Add Question'}
            </button>
          </div>
        </form>
      </div>
  
      {/* Question List */}
      <div className="lg:col-span-7">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-indigo-600 font-bold">{questions.length}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Question Bank</h2>
            </div>
            {questions.length > 0 && (
              <span className="text-sm text-gray-500">
                Total Points: {questions.reduce((sum, q) => sum + (q.points || 1), 0)}
              </span>
            )}
          </div>
  
          {questions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-4xl mb-3 text-gray-400">📝</div>
              <p className="text-gray-500 mb-2">No questions added yet</p>
              <p className="text-sm text-gray-400">
                Create your first question using the form on the left
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => {
                if (!question) return null;
                return (
                  <div
                    key={question?._id || `question-${index}`}
                    className={`border rounded-lg p-5 transition-all transform hover:-translate-y-1 hover:shadow-md ${
                      editing && editIndex === index
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-2 text-gray-600 text-sm font-medium">
                          {index + 1}
                        </span>
                        <h3 className="font-medium text-gray-800">{question.text || "Untitled Question"}</h3>
                      </div>
                      <div className="flex items-center ml-4">
                        <span className="text-xs font-semibold inline-block py-1 px-2 rounded text-blue-600 bg-blue-100 uppercase">
                          {question.points || 1} pts
                        </span>
                      </div>
                    </div>
  
                    <div className="pl-8 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(question.options || []).map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`flex items-center p-2 rounded ${
                              optIndex === question.correctOption
                                ? 'bg-green-50 border border-green-100'
                                : ''
                            }`}
                          >
                            <span
                              className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center mr-2 ${
                                optIndex === question.correctOption
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-500'
                              }`}
                            >
                              {optIndex === question.correctOption ? '✓' : optIndex + 1}
                            </span>
                            <span
                              className={`text-sm ${
                                optIndex === question.correctOption
                                  ? 'text-green-800 font-medium'
                                  : 'text-gray-600'
                              }`}
                            >
                              {option || "Empty option"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
  
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editQuestion(index)}
                          className="text-sm px-3 py-1 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteQuestion(question._id, index)}
                          className="text-sm px-3 py-1 rounded text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="flex space-x-1">
                        {index > 0 && (
                          <button
                            onClick={() => question._id && reorderQuestion(question._id, 'up')}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                            title="Move up"
                          >
                            ↑
                          </button>
                        )}
                        {index < questions.length - 1 && (
                          <button
                            onClick={() => question._id && reorderQuestion(question._id, 'down')}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                            title="Move down"
                          >
                            ↓
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
  
        {/* Quiz Summary */}
        {questions.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-800 text-sm">
            <p className="font-medium">Quiz Summary</p>
            <ul className="mt-2 pl-0 space-y-1">
              <li className="flex items-center gap-2">
                <span>📋</span> Total questions: {questions.length}
              </li>
              <li className="flex items-center gap-2">
                <span>🏆</span> Total possible points: {questions.reduce((sum, q) => sum + (q.points || 1), 0)}
              </li>
              <li className="flex items-center gap-2">
                <span>📈</span> Avg points/question:{' '}
                {(questions.reduce((sum, q) => sum + (q.points || 1), 0) / questions.length).toFixed(1)}
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  </div>
  
  );
};

export default ManageQuestions;