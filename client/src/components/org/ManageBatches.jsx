import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Loader, Plus, Layers, Users, ArrowRight, Trash2, Edit, X } from 'lucide-react';

const COLORS = ['#4f46e5','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];

const ManageBatches = () => {
  const [batches,  setBatches]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState({ name: '', subject: '', description: '', color: '#4f46e5', academicYear: '' });
  const [saving,   setSaving]   = useState(false);
  const [delTarget,setDelTarget]= useState(null);

  const load = () => api.get('/org/batches').then(r => setBatches(r.data.batches || [])).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm({ name: '', subject: '', description: '', color: '#4f46e5', academicYear: '' }); setEditing(null); setShowForm(true); };
  const openEdit = b => { setForm({ name: b.name, subject: b.subject || '', description: b.description || '', color: b.color || '#4f46e5', academicYear: b.academicYear || '' }); setEditing(b._id); setShowForm(true); };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await api.put(`/org/batches/${editing}`, form); toast.success('Batch updated'); }
      else         { await api.post('/org/batches', form); toast.success('Batch created'); }
      setShowForm(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/org/batches/${delTarget._id}`); toast.success('Batch deleted'); setDelTarget(null); load(); }
    catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader className="animate-spin h-6 w-6 text-indigo-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/org" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">← Organisation</Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Batches</h1>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus className="h-4 w-4" /> New batch
          </button>
        </div>

        {batches.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
            <Layers className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="font-medium text-gray-700 dark:text-gray-300">No batches yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first batch to group students and assign quizzes.</p>
            <button onClick={openNew} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="h-4 w-4" /> Create batch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map(b => (
              <div key={b._id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                {/* Colour header */}
                <div className="h-1.5 w-full" style={{ backgroundColor: b.color || '#4f46e5' }} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{b.name}</h3>
                      {b.subject && <p className="text-xs text-gray-400 mt-0.5">{b.subject}{b.academicYear ? ` · ${b.academicYear}` : ''}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(b)} className="p-1.5 rounded text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => setDelTarget(b)} className="p-1.5 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  {b.description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{b.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {b.studentCount ?? b.students?.length ?? 0} students
                    </span>
                    {b.assignmentCount > 0 && (
                      <span className="flex items-center gap-1">
                        {b.assignmentCount} quiz{b.assignmentCount !== 1 ? 'zes' : ''}
                      </span>
                    )}
                  </div>
                  <Link to={`/org/batches/${b._id}`}
                    className="flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                    Manage batch <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 dark:text-white">{editing ? 'Edit batch' : 'New batch'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Class 10 Maths"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                  <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Physics"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                  <input value={form.academicYear} onChange={e => setForm(p => ({ ...p, academicYear: e.target.value }))} placeholder="2024–25"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Colour</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Create batch'}
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
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Delete batch?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              "<span className="font-medium text-gray-700 dark:text-gray-300">{delTarget.name}</span>" and all its assignments will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDelTarget(null)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBatches;
