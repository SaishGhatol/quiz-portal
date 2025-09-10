import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft, Loader, Info } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: '',
    passScore: 70,
    timeLimit: 10,
    isPublished: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formattedData = {
        ...formData,
        timeLimit: parseInt(formData.timeLimit, 10) || 0,
        passScore: parseInt(formData.passScore, 10) || 0,
      };
      const response = await api.post('/admin/quizzes/create', formattedData);
      toast.success('Quiz details saved! Redirecting to add questions...', { theme: 'dark' });
      navigate(`/admin/quizzes/${response.data.quiz._id}/questions`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create quiz';
      toast.error(errorMessage, { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <Link to="/admin/quizzes" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          Back to Quizzes
        </Link>
        <h1 className="text-4xl font-bold text-white mt-2">Create New Quiz</h1>
        <p className="text-gray-400 mt-1">Fill in the details below to set up your new quiz.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Core Information */}
        <div className="bg-gray-950 border border-gray-800 rounded-2xl">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">Core Information</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="relative">
              <input id="title" name="title" type="text" className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent focus:outline-none focus:ring-1 focus:ring-gray-500" placeholder="Quiz Title" value={formData.title} onChange={handleChange} required />
              <label htmlFor="title" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-400">Quiz Title</label>
            </div>
            <div className="relative">
              <textarea id="description" name="description" rows="4" className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent focus:outline-none focus:ring-1 focus:ring-gray-500" placeholder="Quiz Description" value={formData.description} onChange={handleChange} required />
              <label htmlFor="description" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-400">Quiz Description</label>
            </div>
             <div className="relative">
              <input id="category" name="category" type="text" className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent focus:outline-none focus:ring-1 focus:ring-gray-500" placeholder="Category (e.g., Science)" value={formData.category} onChange={handleChange} required />
              <label htmlFor="category" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-400">Category</label>
            </div>
          </div>
        </div>

        {/* Card 2: Rules & Configuration */}
        <div className="bg-gray-950 border border-gray-800 rounded-2xl">
           <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">Rules & Configuration</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-400 mb-2">Difficulty</label>
              <select id="difficulty" name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full px-3 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500" required>
                <option value="">Select...</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="relative">
              <input id="passScore" name="passScore" type="number" min="0" max="100" className="peer w-full h-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent focus:outline-none focus:ring-1 focus:ring-gray-500" placeholder="Pass Score (%)" value={formData.passScore} onChange={handleChange} required />
              <label htmlFor="passScore" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-10 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-400">Pass Score (%)</label>
            </div>
            <div className="relative md:col-span-2">
              <input id="timeLimit" name="timeLimit" type="number" min="0" className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent focus:outline-none focus:ring-1 focus:ring-gray-500" placeholder="Time Limit (minutes)" value={formData.timeLimit} onChange={handleChange} />
              <label htmlFor="timeLimit" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-400">Time Limit (minutes)</label>
               <p className="text-xs text-gray-500 mt-2 ml-1 flex items-center gap-1.5"><Info size={12}/> Set to 0 for no time limit.</p>
            </div>
          </div>
        </div>
        
        {/* Card 3: Publication */}
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 flex items-center justify-between">
            <div>
                <h2 className="text-lg font-semibold text-white">Publish Quiz</h2>
                <p className="text-sm text-gray-400 mt-1">Make this quiz visible and available for users to take.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="isPublished" name="isPublished" checked={formData.isPublished} onChange={handleChange} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-gray-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
            </label>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-800">
            <Link to="/admin/quizzes" className="px-6 py-3 bg-gray-900 border border-gray-800 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                Cancel
            </Link>
            <button type="submit" disabled={loading} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50">
              {loading ? (
                <> <Loader className="animate-spin mr-2 h-5 w-5" /> Creating... </>
              ) : (
                <> <Save className="w-5 h-5 mr-2" /> Save & Add Questions </>
              )}
            </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuiz;

