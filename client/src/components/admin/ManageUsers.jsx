import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { 
  Users, Search, ChevronDown, MoreHorizontal, X, Eye, Shield, CheckCircle, XCircle, 
  Loader, AlertTriangle, UserPlus, ArrowLeft, Clock, Activity, UserCog, UserX, UserCheck
} from 'lucide-react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ role: 'all', status: 'all', sortBy: 'createdAt', sortOrder: 'desc' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
      setError(null);
    } catch (err) {
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredAndSortedUsers = useMemo(() => {
    return users
      .filter(user => {
        const search = searchTerm.toLowerCase();
        if (user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search)) {
          if (filters.role === 'all' || user.role === filters.role) {
            if (filters.status === 'all') return true;
            return filters.status === 'active' ? user.isActive : !user.isActive;
          }
        }
        return false;
      })
      .sort((a, b) => {
        const aVal = a[filters.sortBy];
        const bVal = b[filters.sortBy];
        if (filters.sortOrder === 'asc') {
            return typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
        } else {
            return typeof bVal === 'string' ? bVal.localeCompare(aVal) : bVal - aVal;
        }
      });
  }, [users, searchTerm, filters]);
  
  const handleUpdateUser = async (userId, data) => {
    try {
      await api.put(`/users/${userId}`, data);
      const updatedUsers = users.map(u => u._id === userId ? { ...u, ...data } : u);
      setUsers(updatedUsers);
      if (selectedUser?._id === userId) {
        setSelectedUser(prev => ({ ...prev, ...data }));
      }
      toast.success('User updated successfully.', { theme: 'dark' });
    } catch (err) {
      toast.error('Failed to update user.', { theme: 'dark' });
    }
  };

  const openSlideover = async (user) => {
    try {
      // Fetch fresh details just in case
      const response = await api.get(`/users/${user._id}`);
      setSelectedUser(response.data.user);
      setIsSlideoverOpen(true);
    } catch(err) {
       toast.error('Failed to fetch user details.', { theme: 'dark' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader className="animate-spin h-8 w-8 text-gray-500"/></div>;
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-500/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Data</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={fetchUsers} className="px-5 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">User Management</h1>
            <p className="text-gray-400 mt-1">View, manage, and monitor all users on the platform.</p>
          </div>
        </header>

        <div className="bg-gray-950 border border-gray-800 rounded-2xl">
          <div className="p-4 flex flex-col md:flex-row items-center gap-4 border-b border-gray-800">
            <div className="relative w-full md:w-auto flex-grow">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search users..." className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"/>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto" ref={dropdownRef}>
              <div className="relative">
                <button onClick={() => setDropdownOpen(dropdownOpen === 'role' ? null : 'role')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800 w-full justify-between">
                  Role: <span className="font-semibold text-white capitalize">{filters.role}</span> <ChevronDown size={16} />
                </button>
                {dropdownOpen === 'role' && <div className="absolute right-0 top-full mt-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-10"><button onClick={() => { setFilters(f => ({...f, role: 'all'})); setDropdownOpen(null); }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">All</button><button onClick={() => { setFilters(f => ({...f, role: 'admin'})); setDropdownOpen(null); }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">Admin</button><button onClick={() => { setFilters(f => ({...f, role: 'user'})); setDropdownOpen(null); }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">User</button></div>}
              </div>
              <div className="relative">
                <button onClick={() => setDropdownOpen(dropdownOpen === 'status' ? null : 'status')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800 w-full justify-between">
                  Status: <span className="font-semibold text-white capitalize">{filters.status}</span> <ChevronDown size={16} />
                </button>
                {dropdownOpen === 'status' && <div className="absolute right-0 top-full mt-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-10"><button onClick={() => { setFilters(f => ({...f, status: 'all'})); setDropdownOpen(null); }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">All</button><button onClick={() => { setFilters(f => ({...f, status: 'active'})); setDropdownOpen(null); }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">Active</button><button onClick={() => { setFilters(f => ({...f, status: 'inactive'})); setDropdownOpen(null); }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800">Inactive</button></div>}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
              <table className="min-w-full">
                  <thead className="bg-gray-900"><tr className="border-b border-gray-800"><th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">User</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Role</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Joined</th><th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase"></th></tr></thead>
                  <tbody className="divide-y divide-gray-800">
                  {filteredAndSortedUsers.map(user => (
                      <tr key={user._id} className="hover:bg-gray-900 transition-colors cursor-pointer" onClick={() => openSlideover(user)}>
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><img src={user.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} className="w-8 h-8 rounded-full bg-gray-800"/><div><div className="font-medium text-white">{user.name}</div><div className="text-xs text-gray-500">{user.email}</div></div></div></td>
                      <td className="px-5 py-4 text-sm text-gray-400 capitalize">{user.role}</td>
                      <td className="px-5 py-4"><div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}><div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-yellow-400'}`}></div>{user.isActive ? 'Active' : 'Inactive'}</div></td>
                      <td className="px-5 py-4 text-sm text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4 text-right"><MoreHorizontal size={18} className="text-gray-500"/></td>
                      </tr>
                  ))}
                  </tbody>
              </table>
               {filteredAndSortedUsers.length === 0 && <div className="text-center py-12"><p className="text-gray-500">No users match your criteria.</p></div>}
          </div>
        </div>
      </div>
      
      <UserDetailSlideover user={selectedUser} isOpen={isSlideoverOpen} onClose={() => setIsSlideoverOpen(false)} onUpdate={handleUpdateUser} />
    </>
  );
};

// Slide-Over Panel Component
const UserDetailSlideover = ({ user, isOpen, onClose, onUpdate }) => {
    if (!user) return null;

    const handleRoleChange = (e) => onUpdate(user._id, { role: e.target.value });
    const handleStatusChange = () => onUpdate(user._id, { isActive: !user.isActive });

    return (
        <div className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
            <div className={`fixed top-0 right-0 h-full w-full max-w-lg bg-gray-950 border-l border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
                <div className="h-full flex flex-col">
                    <header className="p-4 flex items-center justify-between border-b border-gray-800 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <img src={user.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} className="w-12 h-12 rounded-full bg-gray-800"/>
                            <div>
                                <h2 className="text-xl font-bold text-white">{user.name}</h2>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-full"><X size={20}/></button>
                    </header>
                    <div className="flex-grow overflow-y-auto p-6 space-y-6">
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-400 mb-4">Account Status</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500">Role</label>
                                    <select value={user.role} onChange={handleRoleChange} className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm">
                                        <option value="user">User</option><option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Status</label>
                                    <div className="mt-1 flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                                        <span className={`flex items-center gap-2 text-sm font-medium ${user.isActive ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {user.isActive ? <UserCheck size={16}/> : <UserX size={16}/>} {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <button onClick={handleStatusChange} className={`px-3 py-1 text-xs font-semibold rounded-md ${user.isActive ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}>
                                            {user.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                         <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-400 mb-4">User Info</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500">Joined Date</span><span className="text-white font-medium">{new Date(user.createdAt).toLocaleDateString()}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Last Login</span><span className="text-white font-medium">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</span></div>
                            </div>
                        </div>
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-400 mb-4">Recent Activity</h3>
                            <div className="space-y-2">
                                {user.attempts?.length > 0 ? (
                                    user.attempts.slice(0, 5).map(attempt => (
                                        <div key={attempt._id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-gray-800/50">
                                            <div>
                                                <p className="font-medium text-white">{attempt.quiz?.title || 'Untitled Quiz'}</p>
                                                <p className="text-xs text-gray-500">{new Date(attempt.completedAt).toLocaleDateString()}</p>
                                            </div>
                                            <p className="font-semibold text-white">{Math.round(attempt.score/attempt.maxScore*100)}%</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">No recent attempts.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageUsers;
