import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Save, HelpCircle, BarChart2, Calendar, Tag } from 'lucide-react';
import { Page, PageHeader, Button, Spinner, ErrorState } from '../ui';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import ProctoringSettings from './ProctoringSettings';
import { DEFAULT_PROCTORING } from '../../utils/useProctoring';

// ISO date from the API → value for <input type="datetime-local"> in the browser's time zone
const toLocalInput = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = v => (v ? new Date(v).toISOString() : null);

const inputCls = 'w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent';

// Defined at module level so the form subtree isn't remounted (and inputs don't lose focus) on every keystroke
const Section = ({ title, children }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
      <h2 className="font-bold text-gray-900 dark:text-white">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

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
    startDate: '', endDate: '', tags: '',
    proctoring: { ...DEFAULT_PROCTORING },
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
        startDate: toLocalInput(q.startDate),
        endDate: toLocalInput(q.endDate),
        tags: (q.tags || []).join(', '),
        proctoring: { ...DEFAULT_PROCTORING, ...(q.proctoring || {}) },
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
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      toast.error('"Available until" must be after "Available from"');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/quizzes/${id}`, {
        ...form,
        timeLimit: parseInt(form.timeLimit, 10) || 0,
        passScore: parseInt(form.passScore, 10) || 0,
        startDate: fromLocalInput(form.startDate),
        endDate: fromLocalInput(form.endDate),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      toast.success('Quiz updated');
      navigate('/admin/quizzes');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  if (loading) return <Page width="md"><Spinner label="Loading quiz" /></Page>;

  if (error) return (
    <Page width="md">
      <ErrorState message={error} onRetry={load} />
    </Page>
  );

  return (
    <Page width="md">

        <PageHeader back={{ to: '/admin/quizzes', label: 'Quizzes' }} title="Edit Quiz" />

        <form onSubmit={handleSubmit} className="space-y-5">

          <Section title="Core Details">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input name="title" required maxLength={200} value={form.title} onChange={change} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                <textarea name="description" rows={4} required maxLength={2000} value={form.description} onChange={change} className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                <input name="category" required maxLength={100} value={form.category} onChange={change} className={inputCls} />
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
                <input name="timeLimit" type="number" min="0" max="300" value={form.timeLimit} onChange={change} className={inputCls} />
              </div>
            </div>
          </Section>

          <Section title="Schedule & Tags">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-startDate" className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Calendar className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" /> Available from</label>
                <input id="edit-startDate" name="startDate" type="datetime-local" value={form.startDate} onChange={change} className={inputCls} />
                <p className="text-xs text-gray-400 mt-1">Leave blank to allow access immediately.</p>
              </div>
              <div>
                <label htmlFor="edit-endDate" className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Calendar className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" /> Available until</label>
                <input id="edit-endDate" name="endDate" type="datetime-local" value={form.endDate} min={form.startDate || undefined} onChange={change} className={inputCls} />
                <p className="text-xs text-gray-400 mt-1">Leave blank for no expiry.</p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="edit-tags" className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Tag className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" /> Tags <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                <input id="edit-tags" name="tags" value={form.tags} onChange={change} placeholder="e.g. science, chapter-3, midterm" className={inputCls} />
              </div>
            </div>
          </Section>

          <ProctoringSettings
            value={form.proctoring}
            onChange={proctoring => setForm(p => ({ ...p, proctoring }))}
          />

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
                  <p className="text-xs text-gray-400 mt-0.5">{qCount > 0 ? 'Make this quiz visible to users.' : 'Add at least one question before publishing.'}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={change} className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-brand-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
              </div>
            </div>
          </Section>

          <div className="flex justify-end gap-3 pt-2">
            <Button to="/admin/quizzes" variant="secondary">
              Cancel
            </Button>
            <Button type="submit" icon={Save} loading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
    </Page>
  );
};

export default EditQuiz;
