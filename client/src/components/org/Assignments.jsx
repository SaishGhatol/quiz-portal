import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Plus, Trash2, X, Calendar, BookOpen, Pencil, CalendarClock } from 'lucide-react';
import { Page, PageHeader, Button, Spinner, EmptyState } from '../ui';

const EMPTY_FORM = { quizId: '', batchId: '', startDate: '', dueDate: '', maxAttempts: 1, instructions: '' };

// ISO date → value for <input type="datetime-local"> in the viewer's time zone
const toLocalInput = d => {
  if (!d) return '';
  const x = new Date(d);
  return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
// datetime-local value (local time) → ISO string the server reads unambiguously
const toIso = v => (v ? new Date(v).toISOString() : null);
const fmt = d => new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [quizzes,     setQuizzes]     = useState([]);
  const [batches,     setBatches]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [delTarget,   setDelTarget]   = useState(null);
  const [deleting,    setDeleting]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [editing,     setEditing]     = useState(null);  // assignment being edited, null when creating
  const [initial,     setInitial]     = useState(EMPTY_FORM);

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setInitial(EMPTY_FORM); setShowForm(true); };
  const openEdit = a => {
    const f = {
      quizId: a.quiz?._id || '', batchId: a.batch?._id || '',
      startDate: toLocalInput(a.startDate), dueDate: toLocalInput(a.dueDate),
      maxAttempts: a.maxAttempts || 1, instructions: a.instructions || '',
    };
    setEditing(a); setForm(f); setInitial(f); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const load = async () => {
    try {
      // /admin/quizzes (not the public /quizzes) so this only ever lists our
      // own organisation's quizzes — the public endpoint returns every quiz on
      // the platform, including other institutes' drafts.
      const [aRes, qRes, bRes] = await Promise.all([api.get('/org/assignments'), api.get('/admin/quizzes', { params: { limit: 500 } }), api.get('/org/batches')]);
      setAssignments(aRes.data.assignments || []);
      setQuizzes(qRes.data.quizzes || []);
      setBatches(bRes.data.batches || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load assignments');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSave = async e => {
    e.preventDefault();
    const attempts = parseInt(form.maxAttempts, 10);
    if (!Number.isInteger(attempts) || attempts < 1 || attempts > 10) { toast.error('Max attempts must be from 1 to 10'); return; }
    if (form.dueDate && form.startDate && new Date(form.dueDate) <= new Date(form.startDate)) {
      toast.error('Due date must be after the start date'); return;
    }
    if (form.dueDate && form.dueDate !== initial.dueDate && new Date(form.dueDate) < new Date()) {
      toast.error('Due date is in the past'); return;
    }
    setSaving(true);
    try {
      if (editing) {
        // Only send dates that changed, so an untouched past due date doesn't trip validation
        const body = { maxAttempts: attempts, instructions: form.instructions };
        if (form.startDate !== initial.startDate) body.startDate = toIso(form.startDate);
        if (form.dueDate !== initial.dueDate)     body.dueDate   = toIso(form.dueDate);
        await api.put(`/org/assignments/${editing._id}`, body);
        toast.success('Assignment updated');
      } else {
        await api.post('/org/assignments', {
          quizId: form.quizId, batchId: form.batchId, instructions: form.instructions,
          startDate: toIso(form.startDate), dueDate: toIso(form.dueDate), maxAttempts: attempts,
        });
        toast.success('Quiz assigned');
      }
      closeForm(); setForm(EMPTY_FORM);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not save the assignment'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await api.delete(`/org/assignments/${delTarget._id}`); toast.success('Assignment removed'); setDelTarget(null); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Could not remove the assignment'); }
    finally { setDeleting(false); }
  };

  if (loading) return <Page><Spinner label="Loading assignments" /></Page>;

  return (
    <>
      <Page>

        <PageHeader
          back={{ to: '/org', label: 'Organisation' }}
          title="Assignments"
          description="Assign quizzes to batches with optional schedules."
          actions={<Button icon={Plus} onClick={openNew}>Assign quiz</Button>}
        />

        {assignments.length === 0 ? (
          <EmptyState
            className="border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl"
            icon={BookOpen}
            title="No assignments yet"
            description="Assign a quiz to a batch to get started."
            action={<Button icon={Plus} onClick={openNew}>Assign quiz</Button>}
          />
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
              <span className="col-span-4">Quiz</span>
              <span className="col-span-3">Batch</span>
              <span className="col-span-3">Schedule</span>
              <span className="col-span-2 text-right">Actions</span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {assignments.map(a => {
                const isExpired  = a.dueDate && new Date(a.dueDate) < new Date();
                const isUpcoming = a.startDate && new Date(a.startDate) > new Date();
                return (
                  <div key={a._id} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="col-span-4 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.quiz?.title || '—'}</p>
                      <p className="text-xs text-gray-400">{a.quiz?.category} · {a.quiz?.totalQuestions}Q</p>
                    </div>
                    <div className="col-span-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: a.batch?.color + '20' || '#effcfa', color: a.batch?.color || '#0b847c' }}>
                        {a.batch?.name || '—'}
                      </span>
                    </div>
                    <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400">
                      {a.startDate && (
                        <span className={`flex items-center gap-1 mb-0.5 ${isUpcoming ? 'text-sky-600 dark:text-sky-400' : ''}`}>
                          <CalendarClock className="h-3 w-3" aria-hidden="true" />
                          {isUpcoming ? 'Opens' : 'Opened'} {fmt(a.startDate)}
                        </span>
                      )}
                      {a.dueDate ? (
                        <span className={`flex items-center gap-1 ${isExpired ? 'text-red-500 dark:text-red-400' : ''}`}>
                          <Calendar className="h-3 w-3" aria-hidden="true" />
                          {isExpired ? 'Closed' : 'Due'} {fmt(a.dueDate)}
                        </span>
                      ) : 'No deadline'}
                      <span className="block mt-0.5">Max {a.maxAttempts} attempt{a.maxAttempts !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="col-span-2 flex justify-end gap-1">
                      <button onClick={() => openEdit(a)} title="Edit assignment" aria-label={`Edit assignment ${a.quiz?.title || ''}`} className="p-1.5 rounded text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDelTarget(a)} title="Remove assignment" aria-label="Remove assignment" className="p-1.5 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Page>

      {/* Assign modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-pop p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 dark:text-white">{editing ? 'Edit assignment' : 'Assign quiz to batch'}</h3>
              <button onClick={closeForm} aria-label="Close" className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quiz *</label>
                {editing ? (
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">{editing.quiz?.title || '—'}</p>
                ) : quizzes.length === 0 ? (
                  <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                    You haven't created a quiz yet.{' '}
                    <Link to="/admin/quizzes/create" className="text-brand-600 dark:text-brand-400 hover:underline">Create one first</Link>.
                  </p>
                ) : (
                  <select required value={form.quizId} onChange={e => setForm(p => ({ ...p, quizId: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">Select quiz…</option>
                    {quizzes.map(q => (
                      <option key={q._id} value={q._id} disabled={!q.totalQuestions}>
                        {q.title} — {q.totalQuestions || 0}Q{!q.isPublished ? ' · Draft' : ''}{!q.totalQuestions ? ' (no questions yet)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Batch *</label>
                {editing ? (
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">{editing.batch?.name || '—'}</p>
                ) : batches.length === 0 ? (
                  <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                    You haven't created a batch yet.{' '}
                    <Link to="/org/batches" className="text-brand-600 dark:text-brand-400 hover:underline">Create one first</Link>.
                  </p>
                ) : (
                  <select required value={form.batchId} onChange={e => setForm(p => ({ ...p, batchId: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">Select batch…</option>
                    {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Available from</label>
                  <input type="datetime-local" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due date</label>
                  <input type="datetime-local" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max attempts</label>
                <input type="number" min="1" max="10" value={form.maxAttempts} onChange={e => setForm(p => ({ ...p, maxAttempts: e.target.value }))}
                  className="w-32 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instructions</label>
                <textarea rows={2} value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} placeholder="Optional instructions for students…"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="secondary" className="flex-1" onClick={closeForm}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {editing ? (saving ? 'Saving…' : 'Save changes') : (saving ? 'Assigning…' : 'Assign quiz')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {delTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-pop p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Remove assignment?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Remove <span className="font-medium text-gray-800 dark:text-gray-200">{delTarget.quiz?.title}</span> from <span className="font-medium text-gray-800 dark:text-gray-200">{delTarget.batch?.name}</span>?
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setDelTarget(null)} disabled={deleting}>Cancel</Button>
              <Button variant="danger" className="flex-1" onClick={handleDelete} disabled={deleting}>{deleting ? 'Removing…' : 'Remove'}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Assignments;
