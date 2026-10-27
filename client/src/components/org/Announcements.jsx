import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import ConfirmDialog from '../ConfirmDialog';
import { Plus, Trash2, X, Bell, Pin } from 'lucide-react';
import { Page, PageHeader, Button, Spinner, EmptyState } from '../ui';

const Announcements = () => {
  const [items,    setItems]    = useState([]);
  const [batches,  setBatches]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({ title: '', content: '', batchId: '', isPinned: false });
  const [delTarget, setDelTarget] = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  const load = async () => {
    try {
      const [aRes, bRes] = await Promise.all([api.get('/org/announcements'), api.get('/org/batches')]);
      setItems(aRes.data.announcements || []);
      setBatches(bRes.data.batches || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load announcements');
    } finally { setLoading(false); }
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

  const del = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try { await api.delete(`/org/announcements/${delTarget._id}`); toast.success('Deleted'); setDelTarget(null); load(); }
    catch { toast.error('Failed'); }
    finally { setDeleting(false); }
  };

  if (loading) return <Page width="md"><Spinner label="Loading announcements" /></Page>;

  return (
    <>
      <Page width="md">

        <PageHeader
          back={{ to: '/org', label: 'Organisation' }}
          title="Announcements"
          actions={<Button icon={Plus} onClick={() => setShowForm(true)}>New</Button>}
        />

        {items.length === 0 ? (
          <EmptyState
            className="border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl"
            icon={Bell}
            title="No announcements yet"
            description="Post updates to all students or specific batches."
          />
        ) : (
          <div className="space-y-3">
            {items.map(a => (
              <div key={a._id} className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {a.isPinned && <Pin className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white">{a.title}</p>
                      {a.batchId && <span className="text-xs text-brand-600 dark:text-brand-400">{a.batchId.name || 'Batch'}</span>}
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{a.content}</p>
                      <p className="text-xs text-gray-400 mt-2">{a.createdBy?.name} · {new Date(a.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button onClick={() => setDelTarget(a)} title="Delete announcement" aria-label="Delete announcement" className="p-1.5 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Page>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-pop p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 dark:text-white">Post announcement</h3>
              <button onClick={() => setShowForm(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message *</label>
                <textarea required rows={4} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Send to</label>
                <select value={form.batchId} onChange={e => setForm(p => ({ ...p, batchId: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">All students (org-wide)</option>
                  {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPinned} onChange={e => setForm(p => ({ ...p, isPinned: e.target.checked }))} className="rounded text-brand-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Pin this announcement</span>
              </label>
              <div className="flex gap-3 pt-1">
                <Button variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? 'Posting…' : 'Post announcement'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!delTarget}
        title="Delete announcement?"
        message={delTarget ? `"${delTarget.title}" will be removed for all students immediately.` : ''}
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={del}
        onCancel={() => setDelTarget(null)}
      />
    </>
  );
};

export default Announcements;
