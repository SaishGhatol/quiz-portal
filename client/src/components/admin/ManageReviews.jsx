import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Star, Trash2, CheckCircle, XCircle, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import ConfirmDialog from '../ConfirmDialog';
import { Page, PageHeader, Spinner, EmptyState, ErrorState } from '../ui';

const ManageReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);

  // GET /reviews/all returns an array (accept { reviews } too)
  const load = () => {
    setLoading(true);
    api.get('/reviews/all')
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : Array.isArray(r.data?.reviews) ? r.data.reviews : [];
        setReviews(list);
        setError(null);
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load reviews.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleApprove = async (id) => {
    setBusy(p => ({ ...p, [id]: 'approve' }));
    try {
      const { data } = await api.put(`/reviews/${id}/approve`);
      const approved = typeof data?.approved === 'boolean' ? data.approved : data?.review?.approved;
      setReviews(p => p.map(r => r._id === id ? { ...r, approved: typeof approved === 'boolean' ? approved : !r.approved } : r));
      toast.success(approved === false ? 'Approval revoked' : 'Review approved');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    finally { setBusy(p => ({ ...p, [id]: null })); }
  };

  const deleteReview = async () => {
    const id = pendingDelete?._id;
    if (!id) return;
    setBusy(p => ({ ...p, [id]: 'delete' }));
    try {
      await api.delete(`/reviews/${id}`);
      setReviews(p => p.filter(r => r._id !== id));
      toast.success('Review deleted');
      setPendingDelete(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
    finally { setBusy(p => ({ ...p, [id]: null })); }
  };

  if (loading) return (
    <Page width="md"><Spinner label="Loading reviews" /></Page>
  );

  if (error) return (
    <Page width="md"><ErrorState message={error} onRetry={load} /></Page>
  );

  return (
    <>
      <Page width="md" className="space-y-6">
        <PageHeader
          title="Manage Reviews"
          description="Approved reviews appear in the homepage testimonials."
        />

        {reviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card">
            <EmptyState compact icon={Star} title="No reviews yet." />
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div
                key={r._id}
                className={`bg-white dark:bg-gray-900 border rounded-2xl shadow-card p-5 flex flex-col sm:flex-row gap-4 ${
                  r.approved
                    ? 'border-gray-200 dark:border-gray-800'
                    : 'border-amber-200 dark:border-amber-800/40'
                }`}
              >
                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{r.name}</p>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{r.role}</span>
                    <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                      r.approved
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {r.approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`h-3.5 w-3.5 ${r.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">"{r.quote}"</p>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => toggleApprove(r._id)}
                    disabled={!!busy[r._id]}
                    title={r.approved ? 'Revoke approval' : 'Approve'}
                    aria-label={`${r.approved ? 'Revoke approval for' : 'Approve'} review by ${r.name || 'user'}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                      r.approved
                        ? 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {busy[r._id] === 'approve'
                      ? <Loader className="h-3.5 w-3.5 animate-spin" />
                      : r.approved ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />
                    }
                    {r.approved ? 'Revoke' : 'Approve'}
                  </button>
                  <button
                    onClick={() => setPendingDelete(r)}
                    disabled={!!busy[r._id]}
                    title="Delete review"
                    aria-label={`Delete review by ${r.name || 'user'}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    {busy[r._id] === 'delete'
                      ? <Loader className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />
                    }
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Page>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this review?"
        message="The review is removed permanently and disappears from the homepage testimonials."
        confirmLabel="Delete review"
        busy={busy[pendingDelete?._id] === 'delete'}
        onConfirm={deleteReview}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
};

export default ManageReviews;
