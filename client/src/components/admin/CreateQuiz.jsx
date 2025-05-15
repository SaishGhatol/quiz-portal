import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const CreateQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: '',
    passScore: '',
    timeLimit: 0,
    isPublished: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) || 0 : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.title || !formData.description || !formData.category || !formData.difficulty || formData.passScore === '') {
        toast.error('Please fill all required fields');
        setLoading(false);
        return;
      }

      const formattedData = {
        ...formData,
        timeLimit: parseInt(formData.timeLimit, 10) || 0,
        passScore: parseInt(formData.passScore, 10) || 0,
      };

      const response = await api.post('/admin/quizzes/create', formattedData);
      toast.success('Quiz created successfully');
      navigate(`/admin/quizzes/${response.data.quiz._id}/questions`);
    } catch (error) {
      const errorMessage = error.response?.data?.details || error.response?.data?.message || 'Failed to create quiz';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Optional: Ctrl + Enter to submit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSubmit(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:py-10 lg:px-8">
      {/* Header - Responsive adjustments */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-10 px-4 sm:px-6 py-4 bg-white shadow-md rounded-xl sm:rounded-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Create New Quiz</h1>
        <Link
          to="/admin/quizzes"
          className="inline-flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 bg-gray-700 text-white hover:bg-gray-900 rounded-lg text-sm transition w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quizzes</span>
        </Link>
      </div>

      {/* Form Card - Responsive padding and spacing */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-gray-700 font-medium mb-1 sm:mb-2">Quiz Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                placeholder="Enter quiz title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-gray-700 font-medium mb-1 sm:mb-2">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 h-24 sm:h-28 resize-none"
                placeholder="Describe what this quiz is about"
                required
              />
            </div>

            {/* Two-column layout for medium screens and up */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-gray-700 font-medium mb-1 sm:mb-2">Category</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  placeholder="e.g. Mathematics, Science"
                  required
                />
              </div>

              {/* Difficulty */}
              <div>
                <label htmlFor="difficulty" className="block text-gray-700 font-medium mb-1 sm:mb-2">Difficulty</label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white"
                  required
                >
                  <option value="">Select</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Pass Score */}
              <div>
                <label htmlFor="passScore" className="block text-gray-700 font-medium mb-1 sm:mb-2">
                  Pass Score (%)
                  <span className="block text-xs italic text-gray-500 mt-1">Minimum score to pass</span>
                </label>
                <input
                  type="number"
                  id="passScore"
                  name="passScore"
                  value={formData.passScore}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  required
                />
              </div>

              {/* Time Limit */}
              <div>
                <label htmlFor="timeLimit" className="block text-gray-700 font-medium mb-1 sm:mb-2">
                  Time Limit (min)
                  <span className="block text-xs italic text-gray-500 mt-1">0 = No time limit</span>
                </label>
                <input
                  type="number"
                  id="timeLimit"
                  name="timeLimit"
                  value={formData.timeLimit}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                />
              </div>
            </div>
          </div>

          {/* Buttons - Responsive adjustments */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200 mt-4 sm:mt-6">
            <button
              type="button"
              onClick={() => navigate('/admin/quizzes')}
              className="px-4 py-2 sm:px-6 sm:py-3 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition w-full sm:w-auto ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  Create Quiz
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuiz;