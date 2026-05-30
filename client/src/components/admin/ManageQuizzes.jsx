import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Edit, BarChart2, Trash2, PlusCircle, HelpCircle, Search, Loader, ArrowLeft, X, Copy } from 'lucide-react';

const ManageQuizzes = () => {
  const [quizzes,      setQuizzes]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  useEffect(() => { fetchQuizzes(); }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try { setQuizzes((await api.get('/admin/quizzes')).data.quizzes || []); }
    catch { toast.error('Failed to load quizzes'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/quizzes/${deleteTarget._id}`);
      toast.success('Quiz deleted');
      setQuizzes(q => q.filter(x => x._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch { toast.error('Failed to delete quiz'); }
    finally { setDeleting(false); }
  };

  const handleDuplicate = async (q) => {
    try {
      const res = await api.post(`/admin/quizzes/${q._id}/duplicate`);
      toast.success(`"${q.title}" duplicated as draft`);
      fetchQuizzes();
    } catch { toast.error('Failed to duplicate quiz'); }
  };

  const filtered = quizzes
    .filter(q => filterStatus === 'all' || (filterStatus === 'published' ? q.isPublished : !q.isPublished))
    .filter(q => !search || q.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link to="/admin" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-1">
              <ArrowLeft className="h-3 w-3" /> Admin
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quizzes</h1>
          </div>
          <Link to="/admin/quizzes/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
            <PlusCircle className="h-4 w-4" /> New quiz
          </Link>
        </div>

        {/* Filter bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>}
          </div>
          <div className="flex gap-1">
            {['all', 'published', 'draft'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors
                  ${filterStatus === s ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                {s}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} quiz{filtered.length !== 1 ? 'zes' : ''}</span>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader className="animate-spin h-6 w-6 text-blue-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No quizzes found.{' '}
            <Link to="/admin/quizzes/create" className="text-blue-600 dark:text-blue-400 hover:underline">Create one</Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.map(q => (
                <div key={q._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {/* Published indicator */}
                  <span className={`w-2 h-2 rounded-full shrink-0 ${q.isPublished ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{q.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {q.category && <span>{q.category}</span>}
                      {q.totalQuestions > 0 && <span className="flex items-center gap-1"><HelpCircle className="h-3 w-3" />{q.totalQuestions}Q</span>}
                      <span className={q.isPublished ? 'text-green-600 dark:text-green-400' : ''}>{q.isPublished ? 'Published' : 'Draft'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Link to={`/admin/quizzes/${q._id}/edit`}      title="Edit"       className="p-1.5 rounded text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"><Edit className="h-4 w-4" /></Link>
                    <Link to={`/admin/quizzes/${q._id}/questions`} title="Questions"  className="p-1.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><HelpCircle className="h-4 w-4" /></Link>
                    <Link to={`/admin/quizzes/${q._id}/statistics`}title="Statistics" className="p-1.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><BarChart2 className="h-4 w-4" /></Link>
                    <button onClick={() => handleDuplicate(q)}     title="Duplicate"  className="p-1.5 rounded text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"><Copy className="h-4 w-4" /></button>
                    <button onClick={() => setDeleteTarget(q)}     title="Delete"     className="p-1.5 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Delete quiz?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              "<span className="font-medium text-gray-700 dark:text-gray-300">{deleteTarget.title}</span>" and all its questions will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {deleting && <Loader className="h-3.5 w-3.5 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageQuizzes;
