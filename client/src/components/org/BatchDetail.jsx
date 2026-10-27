import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import ConfirmDialog from '../ConfirmDialog';
import { Loader, Users, BookOpen, UserMinus, Clock, Plus } from 'lucide-react';
import { Page, PageHeader, Button, Spinner, ErrorState, EmptyState, StatCard } from '../ui';

const BatchDetail = () => {
  const { id } = useParams();
  const [batch,       setBatch]       = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [students,    setStudents]    = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState('students');
  const [removing,    setRemoving]    = useState(null);
  const [removeTarget,setRemoveTarget]= useState(null); // student pending removal confirmation
  const [addModal,    setAddModal]    = useState(false);
  const [selected,    setSelected]    = useState('');
  const [adding,      setAdding]      = useState(false);

  const load = async () => {
    try {
      const [bRes, sRes] = await Promise.all([api.get(`/org/batches/${id}`), api.get('/org/students')]);
      setBatch(bRes.data.batch);
      setAssignments(bRes.data.assignments || []);
      const batchStudents = bRes.data.batch.students || [];
      setStudents(batchStudents);
      // Use string comparison for ObjectId equality
      const inBatch = new Set(batchStudents.map(s => (s._id || s).toString()));
      setAllStudents((sRes.data.students || []).filter(s => !inBatch.has(s._id.toString())));
    } catch { toast.error('Failed to load batch'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const removeStudent = async sid => {
    setRemoving(sid);
    try { await api.delete(`/org/batches/${id}/students/${sid}`); toast.success('Student removed'); load(); }
    catch { toast.error('Failed'); } finally { setRemoving(null); setRemoveTarget(null); }
  };

  const addStudent = async () => {
    if (!selected) return;
    setAdding(true);
    try { await api.post(`/org/batches/${id}/students`, { studentId: selected }); toast.success('Student added'); setAddModal(false); setSelected(''); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setAdding(false); }
  };

  if (loading) return <Page><Spinner label="Loading batch" /></Page>;
  if (!batch)  return <Page><ErrorState title="Batch not found." action={<Button to="/org/batches" variant="secondary">Back to batches</Button>} /></Page>;

  return (
    <>
      <Page>

        <PageHeader
          back={{ to: '/org/batches', label: 'Batches' }}
          title={
            <span className="flex items-center gap-3">
              <span className="w-2.5 h-8 rounded-full shrink-0" style={{ backgroundColor: batch.color || '#0b847c' }} aria-hidden="true" />
              {batch.name}
            </span>
          }
          description={batch.subject ? `${batch.subject}${batch.academicYear ? ` · ${batch.academicYear}` : ''}` : undefined}
        />

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: 'Students',    value: students.length,    icon: Users },
            { label: 'Assignments', value: assignments.length, icon: BookOpen },
          ].map((s, i) => (
            <StatCard key={i} icon={s.icon} label={s.label} value={s.value} />
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
          {['students', 'assignments'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors
                ${tab === t ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Students tab */}
        {tab === 'students' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{students.length} student{students.length !== 1 ? 's' : ''}</p>
              <Button size="sm" icon={Plus} onClick={() => setAddModal(true)}>Add student</Button>
            </div>
            {students.length === 0 ? (
              <EmptyState
                compact
                className="border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl"
                icon={Users}
                title="No students in this batch yet"
                description="Add students who have already joined your organisation."
              />
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {students.map(s => (
                    <div key={s._id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300 shrink-0">
                        {s.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.name}</p>
                        <p className="text-xs text-gray-400 truncate">{s.email}</p>
                      </div>
                      {s.lastLoginAt && (
                        <span className="text-xs text-gray-400 flex items-center gap-1 hidden sm:flex">
                          <Clock className="h-3 w-3" /> {new Date(s.lastLoginAt).toLocaleDateString()}
                        </span>
                      )}
                      <button onClick={() => setRemoveTarget(s)} disabled={removing === s._id}
                        title={`Remove ${s.name || 'student'}`} aria-label={`Remove ${s.name || 'student'} from batch`}
                        className="p-1.5 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        {removing === s._id ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <UserMinus className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assignments tab */}
        {tab === 'assignments' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''}</p>
              <Link to="/org/assignments" className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium">Manage all assignments →</Link>
            </div>
            {assignments.length === 0 ? (
              <EmptyState
                compact
                className="border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl"
                icon={BookOpen}
                title="No quizzes assigned to this batch yet"
                action={<Button to="/org/assignments" variant="soft" size="sm">Assign one</Button>}
              />
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {assignments.map(a => (
                    <div key={a._id} className="flex items-center gap-3 px-5 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{a.quiz?.title || 'Unknown Quiz'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {a.quiz?.category} · {a.quiz?.totalQuestions}Q · Max {a.maxAttempts} attempt{a.maxAttempts !== 1 ? 's' : ''}
                          {a.dueDate ? ` · Due ${new Date(a.dueDate).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                      <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded ${!a.dueDate || new Date(a.dueDate) >= new Date() ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                        {!a.dueDate || new Date(a.dueDate) >= new Date() ? 'Active' : 'Expired'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Page>

      {/* Add student modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-pop p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Add student to batch</h3>
            <p className="text-xs text-gray-400 mb-4">Only students already in your organisation are listed here.</p>

            {allStudents.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                All organisation students are already in this batch.{' '}
                <Link to="/org/students" className="text-brand-600 dark:text-brand-400 hover:underline">
                  View students
                </Link>
              </div>
            ) : (
              <select value={selected} onChange={e => setSelected(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Select student…</option>
                {allStudents.map(s => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
              </select>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setAddModal(false); setSelected(''); }}>
                Cancel
              </Button>
              {allStudents.length > 0 && (
                <Button className="flex-1" onClick={addStudent} disabled={!selected} loading={adding}>
                  Add
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove student from batch?"
        message={removeTarget ? `${removeTarget.name} will lose access to this batch's assignments. They'll remain part of your organisation.` : ''}
        confirmLabel="Remove"
        busy={removing === removeTarget?._id}
        onConfirm={() => removeStudent(removeTarget._id)}
        onCancel={() => setRemoveTarget(null)}
      />
    </>
  );
};

export default BatchDetail;
