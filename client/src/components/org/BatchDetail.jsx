import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Loader, Users, BookOpen, ArrowLeft, UserMinus, Clock, Plus, Trash2 } from 'lucide-react';

const BatchDetail = () => {
  const { id } = useParams();
  const [batch,       setBatch]       = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [students,    setStudents]    = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState('students');
  const [removing,    setRemoving]    = useState(null);
  const [addModal,    setAddModal]    = useState(false);
  const [selected,    setSelected]    = useState('');

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
    catch { toast.error('Failed'); } finally { setRemoving(null); }
  };

  const addStudent = async () => {
    if (!selected) return;
    try { await api.post(`/org/batches/${id}/students`, { studentId: selected }); toast.success('Student added'); setAddModal(false); setSelected(''); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader className="animate-spin h-6 w-6 text-indigo-500" /></div>;
  if (!batch)  return <div className="text-center py-20 text-sm text-gray-400">Batch not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <Link to="/org/batches" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3 w-3" /> Batches
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-10 rounded-full" style={{ backgroundColor: batch.color || '#4f46e5' }} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{batch.name}</h1>
                {batch.subject && <p className="text-sm text-gray-500 dark:text-gray-400">{batch.subject}{batch.academicYear ? ` · ${batch.academicYear}` : ''}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Students',    value: students.length,    icon: Users },
            { label: 'Assignments', value: assignments.length, icon: BookOpen },
            { label: 'Join code',   value: batch.joinCode,     icon: null, mono: true },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              {s.icon && <s.icon className="h-4 w-4 text-indigo-500 mb-2" />}
              <p className={`font-bold text-gray-900 dark:text-white ${s.mono ? 'font-mono text-lg tracking-widest text-indigo-600 dark:text-indigo-400' : 'text-xl'}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
          {['students', 'assignments'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors
                ${tab === t ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Students tab */}
        {tab === 'students' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{students.length} student{students.length !== 1 ? 's' : ''}</p>
              <button onClick={() => setAddModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add student
              </button>
            </div>
            {students.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-400">
                No students in this batch. Add students or share the join code.
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {students.map(s => (
                    <div key={s._id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300 shrink-0">
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
                      <button onClick={() => removeStudent(s._id)} disabled={removing === s._id}
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
              <Link to="/org/assignments" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Manage all assignments →</Link>
            </div>
            {assignments.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-400">
                No quizzes assigned to this batch yet.{' '}
                <Link to="/org/assignments" className="text-indigo-600 dark:text-indigo-400 hover:underline">Assign one</Link>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
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
      </div>

      {/* Add student modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Add student to batch</h3>
            <p className="text-xs text-gray-400 mb-4">Only students already in your organisation are listed here.</p>

            {allStudents.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                All organisation students are already in this batch.{' '}
                <Link to="/org/students" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  View students
                </Link>
              </div>
            ) : (
              <select value={selected} onChange={e => setSelected(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select student…</option>
                {allStudents.map(s => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
              </select>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setAddModal(false); setSelected(''); }}
                className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                Cancel
              </button>
              {allStudents.length > 0 && (
                <button onClick={addStudent} disabled={!selected}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                  Add
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchDetail;
