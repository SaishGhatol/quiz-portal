import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Loader, Plus, Trash2, X, Calendar, BookOpen } from 'lucide-react';

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [quizzes,     setQuizzes]     = useState([]);
  const [batches,     setBatches]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [delTarget,   setDelTarget]   = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [form,        setForm]        = useState({ quizId: '', batchId: '', startDate: '', dueDate: '', maxAttempts: 1, instructions: '' });

  const load = async () => {
    try {
      const [aRes, qRes, bRes] = await Promise.all([api.get('/org/assignments'), api.get('/quizzes'), api.get('/org/batches')]);
      setAssignments(aRes.data.assignments || []);
      setQuizzes(qRes.data.quizzes || []);
      setBatches(bRes.data.batches || []);
    } catch { } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/org/assignments', { ...form, quizId: form.quizId, batchId: form.batchId, dueDate: form.dueDate || null, startDate: form.startDate || null, maxAttempts: parseInt(form.maxAttempts) });
      toast.success('Quiz assigned');
      setShowForm(false); setForm({ quizId: '', batchId: '', startDate: '', dueDate: '', maxAttempts: 1, instructions: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/org/assignments/${delTarget._id}`); toast.success('Assignment removed'); setDelTarget(null); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader className="animate-spin h-6 w-6 text-indigo-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/org" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">← Organisation</Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Assignments</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Assign quizzes to batches with optional schedules.</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus className="h-4 w-4" /> Assign quiz
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
            <BookOpen className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="font-medium text-gray-700 dark:text-gray-300">No assignments yet</p>
            <p className="text-sm text-gray-400 mt-1">Assign a quiz to a batch to get started.</p>
            <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="h-4 w-4" /> Assign quiz
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <span className="col-span-4">Quiz</span>
              <span className="col-span-3">Batch</span>
              <span className="col-span-3">Schedule</span>
              <span className="col-span-2 text-right">Actions</span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {assignments.map(a => {
                const isExpired = a.dueDate && new Date(a.dueDate) < new Date();
                return (
                  <div key={a._id} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="col-span-4 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.quiz?.title || '—'}</p>
                      <p className="text-xs text-gray-400">{a.quiz?.category} · {a.quiz?.totalQuestions}Q</p>
                    </div>
                    <div className="col-span-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: a.batch?.color + '20' || '#eef2ff', color: a.batch?.color || '#4f46e5' }}>
                        {a.batch?.name || '—'}
                      </span>
                    </div>
                    <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400">
                      {a.dueDate ? (
                        <span className={`flex items-center gap-1 ${isExpired ? 'text-red-500 dark:text-red-400' : ''}`}>
                          <Calendar className="h-3 w-3" />
                          Due {new Date(a.dueDate).toLocaleDateString()}
                        </span>
                      ) : 'No deadline'}
                      <span className="block mt-0.5">Max {a.maxAttempts} attempt{a.maxAttempts !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="col-span-2 flex justify-end gap-1">
                      <button onClick={() => setDelTarget(a)} className="p-1.5 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Assign modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 dark:text-white">Assign quiz to batch</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quiz *</label>
                <select required value={form.quizId} onChange={e => setForm(p => ({ ...p, quizId: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select quiz…</option>
                  {quizzes.map(q => <option key={q._id} value={q._id}>{q.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Batch *</label>
                <select required value={form.batchId} onChange={e => setForm(p => ({ ...p, batchId: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select batch…</option>
                  {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Available from</label>
                  <input type="datetime-local" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due date</label>
                  <input type="datetime-local" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max attempts</label>
                <input type="number" min="1" max="10" value={form.maxAttempts} onChange={e => setForm(p => ({ ...p, maxAttempts: e.target.value }))}
                  className="w-32 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instructions</label>
                <textarea rows={2} value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} placeholder="Optional instructions for students…"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60">
                  {saving ? 'Assigning…' : 'Assign quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {delTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Remove assignment?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Remove <span className="font-medium text-gray-800 dark:text-gray-200">{delTarget.quiz?.title}</span> from <span className="font-medium text-gray-800 dark:text-gray-200">{delTarget.batch?.name}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDelTarget(null)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;
