import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Info, Calendar, Tag } from 'lucide-react';
import { Page, PageHeader, Button } from '../ui';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import ProctoringSettings from './ProctoringSettings';
import { DEFAULT_PROCTORING } from '../../utils/useProctoring';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: '',
    passScore: 70,
    timeLimit: 10,
    startDate: '',
    endDate: '',
    tags: '',
    proctoring: { ...DEFAULT_PROCTORING },
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
    if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error('"Available until" must be after "Available from"', { theme: 'dark' });
      return;
    }
    setLoading(true);
    try {
      const formattedData = {
        ...formData,
        timeLimit: parseInt(formData.timeLimit, 10) || 0,
        passScore: parseInt(formData.passScore, 10) || 0,
        // datetime-local has no zone: send an ISO instant so the server doesn't guess
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      const response = await api.post('/admin/quizzes/create', formattedData);
      toast.success('Quiz saved as a draft — add questions, then publish it from the quiz list.', { theme: 'dark' });
      navigate(`/admin/quizzes/${response.data.quiz._id}/questions`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create quiz';
      toast.error(errorMessage, { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page width="md">
      <PageHeader
        back={{ to: '/admin/quizzes', label: 'Back to Quizzes' }}
        title="Create New Quiz"
        description="Fill in the details below to set up your new quiz."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Core Information */}
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Core Information</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="relative">
              <input id="title" name="title" type="text" className="peer w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg placeholder-transparent focus:outline-none focus:ring-1 focus:ring-gray-500" placeholder="Quiz Title" value={formData.title} onChange={handleChange} required maxLength={200} />
              <label htmlFor="title" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-white dark:bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-400">Quiz Title</label>
            </div>
            <div className="relative">
              <textarea id="description" name="description" rows="4" className="peer w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg placeholder-transparent focus:outline-none focus:ring-1 focus:ring-gray-500" placeholder="Quiz Description" value={formData.description} onChange={handleChange} required maxLength={2000} />
              <label htmlFor="description" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-white dark:bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-400">Quiz Description</label>
            </div>
             <div className="relative">
              <input id="category" name="category" type="text" className="peer w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg placeholder-transparent focus:outline-none focus:ring-1 focus:ring-gray-500" placeholder="Category (e.g., Science)" value={formData.category} onChange={handleChange} required maxLength={100} />
              <label htmlFor="category" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-white dark:bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-400">Category</label>
            </div>
          </div>
        </div>

        {/* Card 2: Rules & Configuration */}
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card">
           <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Rules & Configuration</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-400 mb-2">Difficulty</label>
              <select id="difficulty" name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full px-3 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500" required>
                <option value="">Select...</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="relative">
              <input id="passScore" name="passScore" type="number" min="0" max="100" className="peer w-full h-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg placeholder-transparent focus:outline-none focus:ring-1 focus:ring-gray-500" placeholder="Pass Score (%)" value={formData.passScore} onChange={handleChange} required />
              <label htmlFor="passScore" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-white dark:bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-10 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-400">Pass Score (%)</label>
            </div>
            <div className="relative md:col-span-2">
              <input id="timeLimit" name="timeLimit" type="number" min="0" max="300" className="peer w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg placeholder-transparent focus:outline-none focus:ring-1 focus:ring-gray-500" placeholder="Time Limit (minutes)" value={formData.timeLimit} onChange={handleChange} />
              <label htmlFor="timeLimit" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-white dark:bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-400">Time Limit (minutes)</label>
               <p className="text-xs text-gray-500 mt-2 ml-1 flex items-center gap-1.5"><Info size={12}/> Up to 300 minutes. Set to 0 for no time limit.</p>
            </div>
          </div>
        </div>
        
        {/* Card 3: Scheduling (Enterprise) */}
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Scheduling <span className="text-sm font-normal text-gray-500 ml-1">(optional)</span></h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Available From</label>
              <input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-500" />
              <p className="text-xs text-gray-500 mt-1">Leave blank to allow access immediately.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Available Until</label>
              <input type="datetime-local" name="endDate" value={formData.endDate} min={formData.startDate || undefined} onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-500" />
              <p className="text-xs text-gray-500 mt-1">Leave blank for no expiry.</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-1"><Tag size={14} /> Tags <span className="text-gray-500 font-normal">(comma-separated)</span></label>
              <input type="text" name="tags" placeholder="e.g. science, chapter-3, midterm" value={formData.tags} onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-500" />
            </div>
          </div>
        </div>

        {/* Card 4: Proctoring */}
        <ProctoringSettings
          value={formData.proctoring}
          onChange={proctoring => setFormData(prev => ({ ...prev, proctoring }))}
        />

        {/* Card 5: Publication — a new quiz has no questions, so it always starts as a draft */}
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card p-6 flex items-start gap-3">
          <Info size={18} className="text-gray-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Saved as a draft</h2>
            <p className="text-sm text-gray-400 mt-1">Add questions next. You can publish the quiz from the quiz list or the edit page once it has at least one question.</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
            <Button to="/admin/quizzes" variant="secondary" size="lg">
                Cancel
            </Button>
            <Button type="submit" size="lg" icon={Save} loading={loading} className="w-full sm:w-auto">
              {loading ? 'Creating...' : 'Save & Add Questions'}
            </Button>
        </div>
      </form>
    </Page>
  );
};

export default CreateQuiz;

