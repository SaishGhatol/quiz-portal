import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Loader, Plus, Trash2, X, Bell, Pin } from 'lucide-react';

const Announcements = () => {
  const [items,    setItems]    = useState([]);
  const [batches,  setBatches]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({ title: '', content: '', batchId: '', isPinned: false });

  const load = async () => {
    try {
      const [aRes, bRes] = await Promise.all([api.get('/org/announcements'), api.get('/org/batches')]);
      setItems(aRes.data.announcements || []);
      setBatches(bRes.data.batches || []);
    } catch { } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/org/announcements', { ...form, batchId: form.batchId || null });
      toast.success('Announcement posted');
      setShowForm(false); setForm({ title: '', content: '', batchId: '', isPinned: false });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const del = async id => {
    try { await api.delete(`/org/announcements/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader className="animate-spin h-6 w-6 text-indigo-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/org" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">← Organisation</Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Announcements</h1>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus className="h-4 w-4" /> New
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
            <Bell className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No announcements yet. Post updates to all students or specific batches.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(a => (
              <div key={a._id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {a.isPinned && <Pin className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white">{a.title}</p>
                      {a.batchId && <span className="text-xs text-indigo-600 dark:text-indigo-400">{a.batchId.name || 'Batch'}</span>}
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{a.content}</p>
                      <p className="text-xs text-gray-400 mt-2">{a.createdBy?.name} · {new Date(a.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button onClick={() => del(a._id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 dark:text-white">Post announcement</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message *</label>
                <textarea required rows={4} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Send to</label>
                <select value={form.batchId} onChange={e => setForm(p => ({ ...p, batchId: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">All students (org-wide)</option>
                  {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPinned} onChange={e => setForm(p => ({ ...p, isPinned: e.target.checked }))} className="rounded text-indigo-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Pin this announcement</span>
              </label>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60">
                  {saving ? 'Posting…' : 'Post announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
