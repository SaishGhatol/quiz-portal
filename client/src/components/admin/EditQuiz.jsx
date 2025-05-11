import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Save, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify'

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

  useEffect(() => {
    // Fetch quiz data when component mounts
    fetchQuizData();
  }, [id]); // Using quizId in dependency array

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
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-md p-8">
          <svg className="animate-spin h-12 w-12 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg text-gray-600">Loading quiz data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 shadow-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Quiz</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchQuizData} 
            className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-10 px-4 py-3 bg-white shadow-md rounded-2xl">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Edit Quiz
        </h1>
        <Link
          to="/admin/quizzes"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-600 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition duration-300 shadow hover:shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Quizzes
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-gray-700 font-medium mb-2">Quiz Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                placeholder="Enter quiz title"
                required
              />
            </div>
            
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-gray-700 font-medium mb-2">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 h-32"
                placeholder="Describe what this quiz is about"
                required
              />
            </div>
            
            {/* Time Limit */}
            <div>
              <label htmlFor="timeLimit" className="block text-gray-700 font-medium mb-2">
                Time Limit (minutes)
                <span className="ml-1 text-sm text-gray-500">Enter 0 for no time limit</span>
              </label>
              <input
                type="number"
                id="timeLimit"
                name="timeLimit"
                value={formData.timeLimit}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              />
            </div>
          </div>
 
          {/* Published Status */}
          <div className="pt-4 border-t border-gray-200">
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  id="isPublished"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out ${formData.isPublished ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ease-in-out ${formData.isPublished ? 'transform translate-x-6' : ''}`}></div>
              </div>
              <div className="ml-3 text-gray-700 font-medium">
                {formData.isPublished ? 'Published' : 'Draft'}
                <p className="text-sm text-gray-500 font-normal">
                  {formData.isPublished ? 'Quiz is currently available to users' : 'Quiz is saved as draft'}
                </p>
              </div>
            </label>
          </div>
          
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 ">
            <button
              type="button"
              onClick={() => navigate('/admin/quizzes')}
              className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-150 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`inline-flex items-center px-6 py-3 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 cursor-pointer ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Update Quiz
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditQuiz;