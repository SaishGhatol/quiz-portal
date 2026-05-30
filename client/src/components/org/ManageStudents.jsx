import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Loader, Search, X, UserMinus, Clock, Users, ArrowLeft } from 'lucide-react';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [removing, setRemoving] = useState(null);

  const load = (s = '') => {
    setLoading(true);
    api.get(`/org/students?search=${s}`)
      .then(r => setStudents(r.data.students || []))
      .catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const remove = async id => {
    if (!confirm('Remove this student from your organisation?')) return;
    setRemoving(id);
    try { await api.delete(`/org/students/${id}`); toast.success('Student removed'); load(search); }
    catch { toast.error('Failed'); } finally { setRemoving(null); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        <div className="mb-8">
          <Link to="/org" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">← Organisation</Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Students</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">All students enrolled in your organisation.</p>
        </div>

        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
            className="w-full pl-9 pr-9 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader className="animate-spin h-6 w-6 text-indigo-500" /></div>
        ) : students.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
            <Users className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="font-medium text-gray-700 dark:text-gray-300">No students yet</p>
            <p className="text-sm text-gray-400 mt-1">Share your invite code from the org dashboard.</p>
            <Link to="/org" className="mt-3 inline-block text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Get invite code →</Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">
              {students.length} student{students.length !== 1 ? 's' : ''}
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {students.map(s => (
                <div key={s._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-bold text-indigo-700 dark:text-indigo-300 shrink-0">
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
                    <span>{s.attemptCount ?? 0} attempts</span>
                  </div>
                  <button onClick={() => remove(s._id)} disabled={removing === s._id}
                    className="p-1.5 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
                    {removing === s._id ? <Loader className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageStudents;
