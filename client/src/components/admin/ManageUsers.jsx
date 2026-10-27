import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import ConfirmDialog from '../ConfirmDialog';
import AuthContext from '../../contexts/AuthContext';
import { Page, PageHeader, Spinner, ErrorState, EmptyState } from '../ui';
import {
  Users, Search, ChevronDown, ChevronRight, X,
  Loader, UserX, UserCheck, Trash2
} from 'lucide-react';

const ROLES = [
  { value: 'user',      label: 'User' },
  { value: 'org_admin', label: 'Org Admin' },
  { value: 'teacher',   label: 'Teacher' },
  { value: 'admin',     label: 'Platform Admin' },
];
const roleLabel = r => ROLES.find(x => x.value === r)?.label || r;

const PAGE_SIZE = 100;

const ManageUsers = () => {
  const { currentUser } = useContext(AuthContext);
  const myId = String(currentUser?._id || currentUser?.id || '');

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ role: 'all', status: 'all', sortBy: 'createdAt', sortOrder: 'desc' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { userId, data, message } or { userId, remove: true, message }
  const [actionBusy, setActionBusy] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(null);
  const dropdownRef = useRef(null);

  // Search, role and status filters run on the server so they cover every user, not just the loaded page
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchUsers = useCallback(async (nextPage = 1) => {
    nextPage === 1 ? setLoading(true) : setLoadingMore(true);
    try {
      const response = await api.get('/admin/users', {
        params: {
          page: nextPage,
          limit: PAGE_SIZE,
          search: debouncedSearch || undefined,
          role: filters.role,
          status: filters.status,
          sortField: filters.sortBy,
          sortDirection: filters.sortOrder,
        },
      });
      const batch = response.data.users || [];
      setUsers(prev => (nextPage === 1 ? batch : [...prev, ...batch]));
      setTotal(response.data.totalUsers ?? batch.length);
      setPage(response.data.currentPage || nextPage);
      setTotalPages(response.data.totalPages || 1);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load users. Please try again.';
      if (nextPage === 1) setError(message);
      else toast.error(message, { theme: 'dark' });
    } finally {
      nextPage === 1 ? setLoading(false) : setLoadingMore(false);
    }
  }, [debouncedSearch, filters]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // /admin/users/:id is the endpoint that actually applies role and isActive changes
  // (the plain /users/:id profile route ignores them).
  const handleUpdateUser = async (userId, data) => {
    try {
      const { data: res } = await api.put(`/admin/users/${userId}`, data);
      const saved = res.user || data;
      setUsers(prev => {
        const next = prev.map(u => u._id === userId ? { ...u, ...saved } : u);
        // Drop users that no longer match the active filters
        return next.filter(u =>
          (filters.role === 'all' || u.role === filters.role) &&
          (filters.status === 'all' || (filters.status === 'active' ? u.isActive : !u.isActive))
        );
      });
      if (selectedUser?._id === userId) {
        setSelectedUser(prev => ({ ...prev, ...saved }));
      }
      toast.success(res.message || 'User updated successfully.', { theme: 'dark' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user.', { theme: 'dark' });
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const { data } = await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      setTotal(t => Math.max(0, t - 1));
      if (selectedUser?._id === userId) {
        setIsSlideoverOpen(false);
        setSelectedUser(null);
      }
      toast.success(data?.message || 'User deleted.', { theme: 'dark' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.', { theme: 'dark' });
    }
  };

  // Role changes, deactivation and deletion all go through a confirmation step —
  // these can lock someone out of their organisation's data or grant platform-wide access.
  const requestUpdate = (userId, data, message) => setPendingAction({ userId, data, message });
  const requestDelete = (userId, userName) => setPendingAction({
    userId,
    remove: true,
    message: `Permanently delete ${userName}? Their attempts, reviews and batch memberships are removed too. This can't be undone — deactivate the account instead if you may need it again.`,
  });

  const confirmPendingAction = async () => {
    if (!pendingAction) return;
    setActionBusy(true);
    if (pendingAction.remove) await handleDeleteUser(pendingAction.userId);
    else await handleUpdateUser(pendingAction.userId, pendingAction.data);
    setActionBusy(false);
    setPendingAction(null);
  };

  const openSlideover = async (user) => {
    try {
      // /admin/users/:id returns { user, recentAttempts } with each attempt's quiz title
      const response = await api.get(`/admin/users/${user._id}`);
      setSelectedUser({ ...response.data.user, recentAttempts: response.data.recentAttempts });
      setIsSlideoverOpen(true);
    } catch {
       toast.error('Failed to fetch user details.', { theme: 'dark' });
    }
  };

  if (loading && users.length === 0 && !error) {
    return <Page width="xl"><Spinner label="Loading users" /></Page>;
  }

  if (error) {
    return (
      <Page width="xl">
        <ErrorState title="Error loading data" message={error} onRetry={() => fetchUsers(1)} />
      </Page>
    );
  }

  const hasFilters = !!debouncedSearch || filters.role !== 'all' || filters.status !== 'all';

  return (
    <>
      <Page width="xl">
        <PageHeader
          title="User Management"
          description="View, manage, and monitor all users on the platform."
        />

        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card">
          <div className="p-4 flex flex-col md:flex-row items-center gap-4 border-b border-gray-200 dark:border-gray-800">
            <div className="relative w-full md:w-auto flex-grow">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" aria-hidden="true" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search users..." aria-label="Search users" className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"/>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto" ref={dropdownRef}>
              <div className="relative">
                <button onClick={() => setDropdownOpen(dropdownOpen === 'role' ? null : 'role')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 w-full justify-between">
                  Role: <span className="font-semibold text-gray-900 dark:text-white capitalize">{filters.role === 'all' ? 'All' : roleLabel(filters.role)}</span> <ChevronDown size={16} />
                </button>
                {dropdownOpen === 'role' && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl z-10">
                    <button onClick={() => { setFilters(f => ({...f, role: 'all'})); setDropdownOpen(null); }} className="block w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">All</button>
                    {ROLES.map(r => (
                      <button key={r.value} onClick={() => { setFilters(f => ({...f, role: r.value})); setDropdownOpen(null); }} className="block w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">{r.label}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button onClick={() => setDropdownOpen(dropdownOpen === 'status' ? null : 'status')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 w-full justify-between">
                  Status: <span className="font-semibold text-gray-900 dark:text-white capitalize">{filters.status}</span> <ChevronDown size={16} />
                </button>
                {dropdownOpen === 'status' && (
                  <div className="absolute right-0 top-full mt-2 w-40 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl z-10">
                    <button onClick={() => { setFilters(f => ({...f, status: 'all'})); setDropdownOpen(null); }} className="block w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">All</button>
                    <button onClick={() => { setFilters(f => ({...f, status: 'active'})); setDropdownOpen(null); }} className="block w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Active</button>
                    <button onClick={() => { setFilters(f => ({...f, status: 'inactive'})); setDropdownOpen(null); }} className="block w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Inactive</button>
                  </div>
                )}
              </div>
              {loading && <Loader className="h-4 w-4 animate-spin text-gray-400" aria-label="Updating list" />}
            </div>
          </div>

          <div className="overflow-x-auto">
              <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/40"><tr className="border-b border-gray-200 dark:border-gray-800"><th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">User</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Role</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Joined</th><th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase"><span className="sr-only">Open</span></th></tr></thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.map(user => (
                      <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => openSlideover(user)}>
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><img src={user.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`} alt="" className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800"/><div><div className="font-medium text-gray-900 dark:text-white">{user.name}</div><div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div></div></div></td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{roleLabel(user.role)}</td>
                      <td className="px-5 py-4"><div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'}`}><div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-yellow-400'}`}></div>{user.isActive ? 'Active' : 'Inactive'}</div></td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4 text-right"><ChevronRight size={18} className="text-gray-300 dark:text-gray-600"/></td>
                      </tr>
                  ))}
                  </tbody>
              </table>
               {users.length === 0 && (
                 <EmptyState
                   compact
                   icon={Users}
                   title={hasFilters ? 'No users match your search or filters.' : 'No users on the platform yet.'}
                 />
               )}
          </div>

          {/* Loaded-count footer + load more, so admins on larger platforms know there's more than one page */}
          {total > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
              <span>Showing {users.length} of {total} users</span>
              {page < totalPages && (
                <button onClick={() => fetchUsers(page + 1)} disabled={loadingMore}
                  className="flex items-center gap-1.5 font-semibold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-60">
                  {loadingMore && <Loader className="h-3 w-3 animate-spin" />} Load more
                </button>
              )}
            </div>
          )}
        </div>
      </Page>

      <UserDetailSlideover
        user={selectedUser}
        isSelf={!!selectedUser && String(selectedUser._id) === myId}
        isOpen={isSlideoverOpen}
        onClose={() => setIsSlideoverOpen(false)}
        onRequestRoleChange={(userId, role, userName) => requestUpdate(userId, { role }, `Change ${userName}'s role to ${roleLabel(role)}? This changes what they can access immediately.`)}
        onRequestStatusChange={(userId, nextActive, userName) => requestUpdate(userId, { isActive: nextActive }, nextActive ? `Reactivate ${userName}'s account?` : `Deactivate ${userName}'s account? They are signed out and won't be able to sign in until reactivated.`)}
        onRequestDelete={requestDelete}
      />

      <ConfirmDialog
        open={!!pendingAction}
        title={pendingAction?.remove ? 'Delete user?' : 'Confirm change'}
        message={pendingAction?.message}
        confirmLabel={pendingAction?.remove ? 'Delete user' : 'Confirm'}
        destructive={!!pendingAction?.remove || pendingAction?.data?.isActive === false || pendingAction?.data?.role === 'admin'}
        busy={actionBusy}
        onConfirm={confirmPendingAction}
        onCancel={() => setPendingAction(null)}
      />
    </>
  );
};

// Slide-Over Panel Component
const UserDetailSlideover = ({ user, isSelf, isOpen, onClose, onRequestRoleChange, onRequestStatusChange, onRequestDelete }) => {
    if (!user) return null;

    const handleRoleChange = (e) => onRequestRoleChange(user._id, e.target.value, user.name);
    const handleStatusChange = () => onRequestStatusChange(user._id, !user.isActive, user.name);

    return (
        <div className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-label={`User details: ${user.name}`} className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
                <div className="h-full flex flex-col">
                    <header className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <img src={user.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`} alt="" className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800"/>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                            </div>
                        </div>
                        <button onClick={onClose} title="Close" aria-label="Close dialog" className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={20}/></button>
                    </header>
                    <div className="flex-grow overflow-y-auto p-6 space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-400 mb-4">Account Status</h3>
                            {isSelf && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">This is your account — you can't change your own role, deactivate or delete yourself.</p>
                            )}
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="user-role-select" className="text-xs text-gray-500 dark:text-gray-400">Role</label>
                                    <select id="user-role-select" value={user.role} onChange={handleRoleChange} disabled={isSelf} className="mt-1 w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white disabled:opacity-60">
                                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Status</span>
                                    <div className="mt-1 flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                                        <span className={`flex items-center gap-2 text-sm font-medium ${user.isActive ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                            {user.isActive ? <UserCheck size={16}/> : <UserX size={16}/>} {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <button onClick={handleStatusChange} disabled={isSelf} className={`px-3 py-1 text-xs font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${user.isActive ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20' : 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20'}`}>
                                            {user.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                         <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-400 mb-4">User Info</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Joined Date</span><span className="text-gray-900 dark:text-white font-medium">{new Date(user.createdAt).toLocaleDateString()}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Last Login</span><span className="text-gray-900 dark:text-white font-medium">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'N/A'}</span></div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-400 mb-4">Recent Activity</h3>
                            <div className="space-y-2">
                                {user.recentAttempts?.length > 0 ? (
                                    user.recentAttempts.slice(0, 5).map(attempt => (
                                        <div key={attempt._id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800/50">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{attempt.quiz?.title || 'Deleted quiz'}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(attempt.completedAt || attempt.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            {attempt.maxScore > 0 && (
                                              <p className="font-semibold text-gray-900 dark:text-white">{Math.round(attempt.score/attempt.maxScore*100)}%</p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent attempts.</p>
                                )}
                            </div>
                        </div>
                        {!isSelf && (
                          <div className="border border-red-200 dark:border-red-900/50 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Danger zone</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Deleting removes the account and its attempts, reviews and batch memberships. Organisation admins must hand over their organisation first.</p>
                            <button onClick={() => onRequestDelete(user._id, user.name)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                              <Trash2 size={14} /> Delete user
                            </button>
                          </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageUsers;
