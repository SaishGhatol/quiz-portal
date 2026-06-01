import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Star, Trash2, CheckCircle, XCircle, Loader } from 'lucide-react';
import { toast } from 'react-toastify';

const ManageReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});

  useEffect(() => {
    api.get('/reviews/all')
      .then(r => setReviews(r.data))
      .catch(() => toast.error('Failed to load reviews'))
      .finally(() => setLoading(false));
  }, []);

  const toggleApprove = async (id) => {
    setBusy(p => ({ ...p, [id]: 'approve' }));
    try {
      const { data } = await api.put(`/reviews/${id}/approve`);
      setReviews(p => p.map(r => r._id === id ? { ...r, approved: data.approved } : r));
    } catch { toast.error('Failed to update'); }
    finally { setBusy(p => ({ ...p, [id]: null })); }
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    setBusy(p => ({ ...p, [id]: 'delete' }));
    try {
      await api.delete(`/reviews/${id}`);
      setReviews(p => p.filter(r => r._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
    finally { setBusy(p => ({ ...p, [id]: null })); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader className="animate-spin h-6 w-6 text-indigo-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Reviews</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Approved reviews appear in the homepage testimonials.
          </p>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-10 text-center text-sm text-gray-400">
            No reviews yet.
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div
                key={r._id}
                className={`bg-white dark:bg-gray-900 border rounded-xl p-5 flex flex-col sm:flex-row gap-4 ${
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
                    onClick={() => deleteReview(r._id)}
                    disabled={!!busy[r._id]}
                    title="Delete review"
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
      </div>
    </div>
  );
};

export default ManageReviews;
