import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Save, AlertTriangle, ArrowLeft, Loader, HelpCircle, BarChart2 } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const inputCls = 'w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

const EditQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);
  const [qCount,   setQCount]   = useState(0);
  const [form,     setForm]     = useState({
    title: '', description: '', category: '', difficulty: '',
    timeLimit: 10, passScore: 70, isPublished: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const [qr, qqr] = await Promise.all([
        api.get(`/quizzes/${id}`),
        api.get(`/quizzes/${id}/questions`),
      ]);
      const q = qr.data.quiz;
      setForm({
        title: q.title || '', description: q.description || '',
        category: q.category || '', difficulty: q.difficulty || '',
        timeLimit: q.timeLimit ?? 10, passScore: q.passScore ?? 70,
        isPublished: q.isPublished || false,
      });
      setQCount(qqr.data.questions?.length || 0);
    } catch { setError('Failed to load quiz.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const change = e => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/quizzes/${id}`, {
        ...form,
        timeLimit: parseInt(form.timeLimit) || 0,
        passScore: parseInt(form.passScore) || 0,
      });
      toast.success('Quiz updated');
      navigate('/admin/quizzes');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center items-center min-h-[50vh] bg-white dark:bg-gray-950"><Loader className="animate-spin h-6 w-6 text-indigo-500" /></div>;

  if (error) return (
    <div className="min-h-[50vh] bg-white dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button onClick={load} className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700">Try Again</button>
      </div>
    </div>
  );

  const Section = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        <div className="mb-8">
          <Link to="/admin/quizzes" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Quizzes
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Quiz</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <Section title="Core Details">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input name="title" required value={form.title} onChange={change} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                <textarea name="description" rows={4} required value={form.description} onChange={change} className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                <input name="category" required value={form.category} onChange={change} className={inputCls} />
              </div>
            </div>
          </Section>

          <Section title="Configuration">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty *</label>
                <select name="difficulty" required value={form.difficulty} onChange={change} className={inputCls}>
                  <option value="">Select…</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pass Score (%)</label>
                <input name="passScore" type="number" min="0" max="100" value={form.passScore} onChange={change} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Limit (min)</label>
                <input name="timeLimit" type="number" min="0" value={form.timeLimit} onChange={change} className={inputCls} />
              </div>
            </div>
          </Section>

          <Section title="Manage">
            <div className="space-y-1">
              <Link to={`/admin/quizzes/${id}/questions`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  <HelpCircle className="h-4 w-4 text-gray-400" /> Manage Questions
                </div>
                <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">{qCount}</span>
              </Link>
              <Link to={`/admin/quizzes/${id}/statistics`}
                className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                <BarChart2 className="h-4 w-4 text-gray-400" /> View Statistics
              </Link>
              <div className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Published</p>
                  <p className="text-xs text-gray-400 mt-0.5">Make this quiz visible to users.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={change} className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
              </div>
            </div>
          </Section>

          <div className="flex justify-end gap-3 pt-2">
            <Link to="/admin/quizzes"
              className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </Link>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">
              {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditQuiz;
