import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Loader, Search, X, UserMinus, Clock, Users } from 'lucide-react';
import ConfirmDialog from '../ConfirmDialog';
import { Page, PageHeader, Button, Spinner, EmptyState } from '../ui';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [removing, setRemoving] = useState(null);
  const [pendingRemove, setPendingRemove] = useState(null);

  const load = (s = '') => {
    setLoading(true);
    api.get('/org/students', { params: { search: s } })
      .then(r => setStudents(r.data.students || []))
      .catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const remove = async () => {
    const id = pendingRemove?._id;
    if (!id) return;
    setRemoving(id);
    try {
      await api.delete(`/org/students/${id}`);
      toast.success('Student removed');
      setPendingRemove(null);
      load(search);
    }
    catch (err) { toast.error(err.response?.data?.message || 'Could not remove this student'); }
    finally { setRemoving(null); }
  };

  return (
    <>
      <Page>

        <PageHeader
          back={{ to: '/org', label: 'Organisation' }}
          title="Students"
          description="All students enrolled in your organisation."
        />

        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
            className="w-full pl-9 pr-9 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>}
        </div>

        {loading ? (
          <Spinner label="Loading students" />
        ) : students.length === 0 ? (
          <EmptyState
            className="border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl"
            icon={Users}
            title="No students yet"
            description="Share your invite code from the org dashboard."
            action={<Button to="/org" variant="soft" size="sm">Get invite code →</Button>}
          />
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/40">
              {students.length} student{students.length !== 1 ? 's' : ''}
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {students.map(s => (
                <div key={s._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-sm font-bold text-brand-700 dark:text-brand-300 shrink-0">
                    {s.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.name}</p>
                    <p className="text-xs text-gray-400 truncate">{s.email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-gray-400 shrink-0">
                    {s.batches?.length > 0 && (
                      <span>{s.batches.map(b => b.name).join(', ')}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleDateString() : 'Never'}
                    </span>
                    <span title="Completed attempts on your organisation's own and assigned quizzes">
                      {s.attemptCount ?? 0} attempt{s.attemptCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  <button onClick={() => setPendingRemove(s)} disabled={removing === s._id}
                    title={`Remove ${s.name || 'student'}`}
                    aria-label={`Remove ${s.name || 'student'} from the organisation`}
                    className="p-1.5 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
                    {removing === s._id ? <Loader className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Page>

      <ConfirmDialog
        open={!!pendingRemove}
        title={`Remove ${pendingRemove?.name || 'this student'}?`}
        message="They lose access to your batches and assignments. Their past attempts are kept."
        confirmLabel="Remove student"
        busy={removing === pendingRemove?._id}
        onConfirm={remove}
        onCancel={() => setPendingRemove(null)}
      />
    </>
  );
};

export default ManageStudents;
