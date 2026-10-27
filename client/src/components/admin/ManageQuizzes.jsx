import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Edit, BarChart2, Trash2, PlusCircle, HelpCircle, Search, X, Copy, BookOpen, Eye, EyeOff, Loader } from 'lucide-react';
import { Page, PageHeader, Button, Spinner, EmptyState, ErrorState } from '../ui';
import ConfirmDialog from '../ConfirmDialog';

const PAGE_SIZE = 50;

const ManageQuizzes = () => {
  const [quizzes,      setQuizzes]      = useState([]);
  const [total,        setTotal]        = useState(0);
  const [counts,       setCounts]       = useState(null);
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState('');
  const [debounced,    setDebounced]    = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [toggling,     setToggling]     = useState(null);

  // Search runs on the server, so wait for typing to pause
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchQuizzes = useCallback(async (nextPage = 1) => {
    nextPage === 1 ? setLoading(true) : setLoadingMore(true);
    try {
      const { data } = await api.get('/admin/quizzes', {
        params: { page: nextPage, limit: PAGE_SIZE, search: debounced || undefined, status: filterStatus },
      });
      setQuizzes(prev => (nextPage === 1 ? data.quizzes || [] : [...prev, ...(data.quizzes || [])]));
      setTotal(data.total ?? 0);
      setCounts(data.counts || null);
      setPage(data.currentPage || nextPage);
      setTotalPages(data.totalPages || 1);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load quizzes';
      if (nextPage === 1) setError(message);
      else toast.error(message);
    } finally {
      nextPage === 1 ? setLoading(false) : setLoadingMore(false);
    }
  }, [debounced, filterStatus]);

  useEffect(() => { fetchQuizzes(1); }, [fetchQuizzes]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/quizzes/${deleteTarget._id}`);
      toast.success('Quiz deleted');
      setDeleteTarget(null);
      fetchQuizzes(1);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete quiz'); }
    finally { setDeleting(false); }
  };

  const handleDuplicate = async (q) => {
    try {
      await api.post(`/admin/quizzes/${q._id}/duplicate`);
      toast.success(`"${q.title}" duplicated as draft`);
      fetchQuizzes(1);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to duplicate quiz'); }
  };

  // Publishing a quiz with no questions is refused by the server with a message; show it
  const handleTogglePublish = async (q) => {
    setToggling(q._id);
    try {
      const { data } = await api.put(`/quizzes/${q._id}`, { isPublished: !q.isPublished });
      const isPublished = data?.quiz?.isPublished ?? !q.isPublished;
      toast.success(isPublished ? `"${q.title}" published` : `"${q.title}" moved to drafts`);
      // Drop it from a filtered list it no longer belongs to
      if (filterStatus !== 'all') {
        setQuizzes(prev => prev.filter(x => x._id !== q._id));
        setTotal(t => Math.max(0, t - 1));
      } else {
        setQuizzes(prev => prev.map(x => (x._id === q._id ? { ...x, isPublished } : x)));
      }
      setCounts(c => c && ({
        ...c,
        published: c.published + (isPublished ? 1 : -1),
        draft: c.draft + (isPublished ? -1 : 1),
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update quiz');
    } finally {
      setToggling(null);
    }
  };

  return (
    <>
      <Page className="space-y-6">

        <PageHeader
          back={{ to: '/admin', label: 'Admin' }}
          title="Quizzes"
          actions={<Button to="/admin/quizzes/create" icon={PlusCircle}>New quiz</Button>}
        />

        {/* Filter bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, category or tag…" aria-label="Search quizzes"
              className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {search && <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>}
          </div>
          <div className="flex gap-1" role="group" aria-label="Filter by status">
            {['all', 'published', 'draft'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} aria-pressed={filterStatus === s}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors
                  ${filterStatus === s ? 'bg-brand-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                {s}{counts && counts[s] !== undefined ? ` (${counts[s]})` : ''}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 ml-auto">{total} quiz{total !== 1 ? 'zes' : ''}</span>
        </div>

        {/* List */}
        {loading ? (
          <Spinner label="Loading quizzes" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchQuizzes(1)} />
        ) : quizzes.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={debounced || filterStatus !== 'all' ? 'No quizzes match your filters' : 'No quizzes yet'}
            action={<Button to="/admin/quizzes/create" variant="soft" size="sm" icon={PlusCircle}>Create one</Button>}
          />
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {quizzes.map(q => (
                <div key={q._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {/* Published indicator */}
                  <span className={`w-2 h-2 rounded-full shrink-0 ${q.isPublished ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} aria-hidden="true" />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{q.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {q.category && <span>{q.category}</span>}
                      <span className="flex items-center gap-1"><HelpCircle className="h-3 w-3" aria-hidden="true" />{q.totalQuestions || 0}Q</span>
                      <span className={q.isPublished ? 'text-green-600 dark:text-green-400' : ''}>{q.isPublished ? 'Published' : 'Draft'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleTogglePublish(q)} disabled={toggling === q._id}
                      title={q.isPublished ? 'Unpublish' : 'Publish'} aria-label={q.isPublished ? `Unpublish ${q.title}` : `Publish ${q.title}`}
                      className="p-1.5 rounded text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50">
                      {toggling === q._id ? <Loader className="h-4 w-4 animate-spin" /> : q.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <Link to={`/admin/quizzes/${q._id}/edit`}      title="Edit quiz" aria-label="Edit quiz"       className="p-1.5 rounded text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"><Edit className="h-4 w-4" /></Link>
                    <Link to={`/admin/quizzes/${q._id}/questions`} title="Manage questions" aria-label="Manage questions"  className="p-1.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><HelpCircle className="h-4 w-4" /></Link>
                    <Link to={`/admin/quizzes/${q._id}/statistics`} title="View statistics" aria-label="View statistics" className="p-1.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><BarChart2 className="h-4 w-4" /></Link>
                    <button onClick={() => handleDuplicate(q)}     title="Duplicate" aria-label={`Duplicate ${q.title}`} className="p-1.5 rounded text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"><Copy className="h-4 w-4" /></button>
                    <button onClick={() => setDeleteTarget(q)}     title="Delete"    aria-label={`Delete ${q.title}`}    className="p-1.5 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paging: loaded count + load more */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
              <span>Showing {quizzes.length} of {total}</span>
              {page < totalPages && (
                <button onClick={() => fetchQuizzes(page + 1)} disabled={loadingMore}
                  className="flex items-center gap-1.5 font-semibold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-60">
                  {loadingMore && <Loader className="h-3 w-3 animate-spin" />} Load more
                </button>
              )}
            </div>
          </div>
        )}
      </Page>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete quiz?"
        message={deleteTarget ? `"${deleteTarget.title}" and all its questions will be permanently deleted.` : ''}
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default ManageQuizzes;
