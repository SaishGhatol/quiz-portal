import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Save, AlertCircle, ArrowLeft, Clock, CheckCircle, HelpCircle, Clipboard, Eye, Loader } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const EditQuiz = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeLimit: 0,
    isPublished: false,
  });
  const [quizStats, setQuizStats] = useState({
    questionCount: 0,
    lastUpdated: ''
  });

  useEffect(() => {
    // Fetch quiz data when component mounts
    fetchQuizData();
  }, [id]);

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/quizzes/${id}`);
      
      // Set form data with the fetched quiz data
      const quizData = response.data.quiz;
      setFormData({
        title: quizData.title || '',
        description: quizData.description || '',
        timeLimit: quizData.timeLimit || 0,
        isPublished: quizData.isPublished || false,
      });

      // Fetch question count
      try {
        const questionsRes = await api.get(`/quizzes/${id}/questions`);
        setQuizStats({
          questionCount: questionsRes.data.questions.length,
          lastUpdated: new Date(quizData.updatedAt || quizData.createdAt).toLocaleDateString()
        });
      } catch (err) {
        console.error(`Error fetching questions for quiz ${id}:`, err);
        setQuizStats({
          questionCount: 0,
          lastUpdated: new Date(quizData.updatedAt || quizData.createdAt).toLocaleDateString()
        });
      }
      
      setError(null);
    } catch (error) {
      console.error('Error fetching quiz data:', error);
      setError('Failed to load quiz data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) || 0 : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await api.put(`/quizzes/${id}`, formData);
      toast.success('Quiz updated successfully');
      navigate('/admin/quizzes');
    } catch (error) {
      console.error('Error updating quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to update quiz');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center justify-center min-h-64 bg-white rounded-lg shadow-md">
          <div className="text-center p-6 sm:p-10">
            <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading your quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 sm:p-8 shadow-md">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-red-800 mb-2">Error Loading Quiz</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchQuizData} 
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header Section - Improved responsiveness */}
      <div className="flex flex-col mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-4 sm:mb-0">Edit Quiz</h1>
          
          <button
            onClick={() => navigate('/admin/quizzes')}
            className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Quizzes
          </button>
        </div>
        
        {/* Quiz stats and actions - Improved for all screen sizes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex items-center">
            <div className="flex items-center mr-4">
              <HelpCircle className="w-5 h-5 mr-2 text-blue-500" />
              <span className="text-sm text-gray-700">
                <span className="font-semibold">{quizStats.questionCount}</span> {quizStats.questionCount === 1 ? 'question' : 'questions'}
              </span>
            </div>
            <div className="flex items-center ml-auto">
              <Clock className="w-5 h-5 mr-2 text-gray-400" />
              <span className="text-sm text-gray-700">Updated {quizStats.lastUpdated}</span>
            </div>
          </div>
          
          <Link
            to={`/admin/quizzes/${id}/questions`}
            className="inline-flex items-center justify-center px-4 py-3 border border-blue-600 rounded-lg text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Manage Questions
          </Link>
        </div>
      </div>

      {/* Main Form Section */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 shadow-sm"
                placeholder="Enter quiz title"
                required
              />
            </div>
            
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 shadow-sm h-24 sm:h-32"
                placeholder="Describe what this quiz is about"
                required
              />
            </div>
            
            {/* Time Limit */}
            <div>
              <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 mb-1">
                Time Limit (minutes)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  id="timeLimit"
                  name="timeLimit"
                  value={formData.timeLimit}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 pr-16 shadow-sm"
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <span className="text-gray-500 pr-4">minutes</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">Enter 0 for no time limit</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200 mt-6 sm:mt-8">
            <button
              type="button"
              onClick={() => navigate('/admin/quizzes')}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-150 shadow-sm order-2 sm:order-1 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 shadow-sm order-1 sm:order-2 w-full sm:w-auto ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Quick Links - Made responsive */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 rounded-md flex items-center justify-center text-blue-600 mr-3 sm:mr-4">
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Questions</h3>
              <p className="text-xs sm:text-sm text-gray-500">Manage quiz questions</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <Link
              to={`/admin/quizzes/${id}/questions`}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center"
            >
              Edit Questions
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-green-100 rounded-md flex items-center justify-center text-green-600 mr-3 sm:mr-4">
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Statistics</h3>
              <p className="text-xs sm:text-sm text-gray-500">View quiz performance</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <Link
              to={`/admin/quizzes/${id}/statistics`}
              className="text-green-600 hover:text-green-800 font-medium text-sm inline-flex items-center"
            >
              View Statistics
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-purple-100 rounded-md flex items-center justify-center text-purple-600 mr-3 sm:mr-4">
              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Preview</h3>
              <p className="text-xs sm:text-sm text-gray-500">Test your quiz</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <Link
              to={`/quizzes`}
              className="text-purple-600 hover:text-purple-800 font-medium text-sm inline-flex items-center"
            >
              Preview Quiz
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditQuiz;