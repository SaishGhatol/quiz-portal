import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Save, AlertTriangle, ArrowLeft, Loader, HelpCircle, BarChart2 } from 'lucide-react';
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
    category: '',
    difficulty: '',
    timeLimit: 0,
    passScore: 70,
    isPublished: false,
  });
  const [questionCount, setQuestionCount] = useState(0);

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      const [quizRes, questionsRes] = await Promise.all([
        api.get(`/quizzes/${id}`),
        api.get(`/quizzes/${id}/questions`)
      ]);
      
      const quizData = quizRes.data.quiz;
      setFormData({
        title: quizData.title || '',
        description: quizData.description || '',
        category: quizData.category || '',
        difficulty: quizData.difficulty || '',
        timeLimit: quizData.timeLimit || 0,
        passScore: quizData.passScore || 0,
        isPublished: quizData.isPublished || false,
      });
      setQuestionCount(questionsRes.data.questions.length);
      setError(null);
    } catch (error) {
      console.error('Error fetching quiz data:', error);
      setError('Failed to load quiz data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
       const formattedData = {
        ...formData,
        timeLimit: parseInt(formData.timeLimit, 10) || 0,
        passScore: parseInt(formData.passScore, 10) || 0,
      };
      await api.put(`/quizzes/${id}`, formattedData);
      toast.success('Quiz updated successfully!', { theme: 'dark' });
      navigate('/admin/quizzes');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update quiz', { theme: 'dark' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader className="animate-spin h-8 w-8 text-gray-500"/></div>;
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-500/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Quiz</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={fetchQuizData} className="px-5 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8">
        <Link to="/admin/quizzes" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          Back to Quizzes
        </Link>
        <h1 className="text-4xl font-bold text-white mt-2">Edit Quiz</h1>
        <p className="text-gray-400 mt-1">Update details, manage questions, and view statistics.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Core Details */}
        <div className="bg-gray-950 border border-gray-800 rounded-2xl">
          <div className="p-6 border-b border-gray-800"><h2 className="text-xl font-semibold text-white">Core Details</h2></div>
          <div className="p-6 space-y-6">
            <div className="relative">
              <input id="title" name="title" type="text" className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent" placeholder="Quiz Title" value={formData.title} onChange={handleChange} required />
              <label htmlFor="title" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs">Quiz Title</label>
            </div>
            <div className="relative">
              <textarea id="description" name="description" rows="5" className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent" placeholder="Quiz Description" value={formData.description} onChange={handleChange} required />
              <label htmlFor="description" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs">Quiz Description</label>
            </div>
          </div>
        </div>

        {/* Card 2: Configuration */}
        <div className="bg-gray-950 border border-gray-800 rounded-2xl">
          <div className="p-6 border-b border-gray-800"><h2 className="text-xl font-semibold text-white">Configuration</h2></div>
          <div className="p-6">
              {/* --- Thematic Group 1: Classification --- */}
              <h3 className="text-sm font-medium text-gray-400 mb-4">CLASSIFICATION</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                    <input id="category" name="category" type="text" className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent" placeholder="Category" value={formData.category} onChange={handleChange} required />
                    <label htmlFor="category" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs">Category</label>
                </div>
                <div>
                    <label htmlFor="difficulty" className="block text-sm font-medium text-gray-400 mb-2">Difficulty</label>
                    <select id="difficulty" name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full px-3 py-3 bg-gray-900 border border-gray-700 rounded-lg" required>
                        <option value="">Select...</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                    </select>
                </div>
              </div>

              <hr className="border-gray-800 my-6" />

              {/* --- Thematic Group 2: Rules & Scoring --- */}
              <h3 className="text-sm font-medium text-gray-400 mb-4">RULES & SCORING</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label htmlFor="passScore" className="block text-sm font-medium text-gray-400 mb-2">Pass Score (%)</label>
                    <input id="passScore" name="passScore" type="number" min="0" max="100" className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg" value={formData.passScore} onChange={handleChange} required />
                 </div>
                 <div>
                    <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-400 mb-2">Time Limit (minutes)</label>
                    <input id="timeLimit" name="timeLimit" type="number" min="0" className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg" value={formData.timeLimit} onChange={handleChange} />
                 </div>
              </div>
          </div>
        </div>

        {/* Card 3: Management */}
        <div className="bg-gray-950 border border-gray-800 rounded-2xl">
          <div className="p-6 border-b border-gray-800"><h2 className="text-xl font-semibold text-white">Management</h2></div>
          <div className="p-4 space-y-2">
            <Link to={`/admin/quizzes/${id}/questions`} className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-900 transition-colors">
              <div className="flex items-center gap-3"><HelpCircle size={18} className="text-gray-400"/><span className="font-semibold text-white">Manage Questions</span></div>
              <span className="text-sm font-mono bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{questionCount}</span>
            </Link>
            <Link to={`/admin/quizzes/${id}/statistics`} className="group flex items-center p-3 rounded-lg hover:bg-gray-900 transition-colors">
              <div className="flex items-center gap-3"><BarChart2 size={18} className="text-gray-400"/><span className="font-semibold text-white">View Statistics</span></div>
            </Link>
             <div className="p-3 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-white">Publish Quiz</h3>
                    <p className="text-sm text-gray-400 mt-1">Make this quiz visible to users.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="isPublished" name="isPublished" checked={formData.isPublished} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-gray-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                </label>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-800">
            <Link to="/admin/quizzes" className="px-6 py-3 bg-gray-900 border border-gray-800 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">Cancel</Link>
            <button type="submit" disabled={saving} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50">
              {saving ? (<><Loader className="animate-spin mr-2 h-5 w-5" /> Saving...</>) : (<><Save className="w-5 h-5 mr-2" /> Save Changes</>)}
            </button>
        </div>
      </form>
    </div>
  );
}

export default EditQuiz;

