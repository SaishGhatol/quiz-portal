import React, { useState, useEffect } from 'react';
import {
  Search, Users, UserCheck, UserX, ChevronDown, ChevronUp, Filter,
  MoreHorizontal, X, Eye, Shield, CheckCircle, XCircle, LogOut,
  Clock, Loader, Activity
} from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import {useNavigate} from "react-router-dom"

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, sortField, sortDirection, filterRole, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Make the API request
      const response = await api.get('/users', {
        params: {
          page: currentPage,
          limit: 10,
          search: searchTerm,
          sortField,
          sortDirection,
          role: filterRole !== 'all' ? filterRole : undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined
        }
      });

      // Check the structure of the response
      let userData = [];

      // If response.data is an array, use it directly
      if (Array.isArray(response.data)) {
        userData = response.data;
      }
      // If response.data has a users property that's an array, use that
      else if (response.data && Array.isArray(response.data.users)) {
        userData = response.data.users;
      }
      // Otherwise check if response.data is an object with our users data
      else if (response.data && typeof response.data === 'object') {
        userData = response.data;
      }

      // Set the users state
      setUsers(userData);

      // Handle pagination information if available
      if (response.data && response.data.totalPages) {
        setTotalPages(response.data.totalPages);
      } else {
        // If no pagination info, assume at least one page
        setTotalPages(1);
      }

      setError(null);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.response?.data?.message || 'Failed to load users. Please try again.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };


  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openUserModal = async (user) => {
    try {
      // Fetch detailed user information including attempts
      const response = await api.get(`/users/${user._id}`);
      setSelectedUser({ ...user, attempts: response.data.attempts });
      setUserModalOpen(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details');
      // Still open the modal with the basic user info we have
      setSelectedUser(user);
      setUserModalOpen(true);
    }
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setUserModalOpen(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}`, { role: newRole });

      setUsers(users.map(user =>
        user._id === userId ? { ...user, role: newRole } : user
      ));

      toast.success('User role updated successfully');

      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleAccountStatus = async (userId, isActive,updateActiveUserCount) => {
    try {
      await api.put(`/users/${userId}`, { isActive });

      setUsers(users.map(user =>
        user._id === userId ? { ...user, isActive } : user
      ));

      toast.success(`User account ${isActive ? 'activated' : 'deactivated'} successfully`);

      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser({ ...selectedUser, isActive });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const toggleFilters = () => {
    setIsFiltersOpen(!isFiltersOpen);
  };

  const resetFilters = () => {
    setFilterRole('all');
    setFilterStatus('all');
    setSortField('name');
    setSortDirection('asc');
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-white rounded-lg shadow-md">
        <div className="text-center p-10">
          <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative my-6" role="alert">
        <div className="flex">
          <div className="py-1"><XCircle className="h-6 w-6 text-red-500 mr-4" /></div>
          <div>
            <p className="font-bold">Error loading users</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm transition duration-150 ease-in-out"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Manage Users</h1>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="text-lg font-semibold">
              Total Users: {users ? users.length : 0}
            </div>

            <button
            onClick={() => navigate('/admin')}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors cursor-pointer"
          >
            <span className="mr-2">←</span>
            Back to Dashboard
          </button>
          </div>

        </div>

        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 pr-3 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
                />
              </div>

              <button
                onClick={toggleFilters}
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition duration-150 ease-in-out"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {isFiltersOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
              </button>
            </div>

            {isFiltersOpen && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none transition duration-150 ease-in-out"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      User
                      <span className="ml-1">{renderSortIcon('name')}</span>
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center">
                      Role
                      <span className="ml-1">{renderSortIcon('role')}</span>
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('isActive')}
                  >
                    <div className="flex items-center">
                      Status
                      <span className="ml-1">{renderSortIcon('isActive')}</span>
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Joined Date
                      <span className="ml-1">{renderSortIcon('createdAt')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users && users.length > 0 ? (
                  users.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                            {user.name && user.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          className="text-sm border border-gray-200 rounded-md p-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive !== false  // Treat undefined as active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          {user.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => openUserModal(user)}
                            className="text-blue-500 hover:text-blue-700 transition duration-150 ease-in-out"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {user.isActive !== false ? (
                            <button
                              onClick={() => handleAccountStatus(user._id, false)}
                              className="text-red-500 hover:text-red-700 transition duration-150 ease-in-out"
                              title="Deactivate"
                            >
                              <UserX size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAccountStatus(user._id, true)}
                              className="text-green-500 hover:text-green-700 transition duration-150 ease-in-out"
                              title="Activate"
                            >
                              <UserCheck size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Users className="h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition duration-150 ease-in-out`}
                >
                  Previous
                </button>

                <div className="hidden md:flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => {
                    // Show page buttons with logic to avoid too many buttons
                    if (
                      totalPages <= 7 ||
                      i === 0 ||
                      i === totalPages - 1 ||
                      (i >= currentPage - 2 && i <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={i + 1}
                          onClick={() => handlePageChange(i + 1)}
                          className={`w-10 h-10 rounded-md flex items-center justify-center ${currentPage === i + 1
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } transition duration-150 ease-in-out`}
                        >
                          {i + 1}
                        </button>
                      );
                    } else if (
                      i === currentPage - 3 ||
                      i === currentPage + 3
                    ) {
                      return (
                        <span
                          key={i}
                          className="w-10 h-10 flex items-center justify-center text-gray-500"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition duration-150 ease-in-out`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {userModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="relative">
              {/* Header with user profile */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
                      {selectedUser.name && selectedUser.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <h2 className="text-2xl font-bold text-gray-800">{selectedUser.name}</h2>
                      <p className="text-gray-600">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={closeUserModal}
                    className="text-gray-400 hover:text-gray-600 transition duration-150 ease-in-out"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-3">
                      <Shield className="text-blue-500 h-5 w-5 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800">Account Status</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Role</p>
                        <select
                          value={selectedUser.role}
                          onChange={(e) => handleRoleChange(selectedUser._id, e.target.value)}
                          className="mt-1 w-full border border-gray-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Account Status</p>
                        <div className="mt-1 flex items-center">
                          {selectedUser.isActive !== false ? (
                            <>
                              <CheckCircle className="text-green-500 h-5 w-5 mr-2" />
                              <span className="text-green-700">Active Account</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="text-red-500 h-5 w-5 mr-2" />
                              <span className="text-red-700">Inactive Account</span>
                            </>
                          )}
                        </div>
                        <div className="mt-2">
                          {selectedUser.isActive !== false ? (
                            <button
                              onClick={() => handleAccountStatus(selectedUser._id, false)}
                              className="inline-flex items-center px-3 py-1 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md hover:bg-red-200 transition duration-150 ease-in-out"
                            >
                              <UserX size={14} className="mr-1" />
                              Deactivate Account
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAccountStatus(selectedUser._id, true)}
                              className="inline-flex items-center px-3 py-1 text-sm text-green-700 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 transition duration-150 ease-in-out"
                            >
                              <UserCheck size={14} className="mr-1" />
                              Activate Account
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-3">
                      <Clock className="text-blue-500 h-5 w-5 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800">Time Information</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Member Since</p>
                        <p className="mt-1 font-medium">
                          {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Last Login</p>
                        <p className="mt-1 font-medium">
                          {selectedUser.lastLogin
                            ? new Date(selectedUser.lastLogin).toLocaleString()
                            : 'Never logged in'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <Activity className="text-blue-500 h-5 w-5 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-800">Activity Information</h3>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-md p-4">
                    {selectedUser.attempts && selectedUser.attempts.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {selectedUser.attempts.map((attempt, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                            <div>
                              <p className="font-medium text-gray-800">Quiz: {attempt.quiz?.title || 'Untitled Quiz'}</p>
                              <p className="text-sm text-gray-500">
                                Completed on {new Date(attempt.completedAt || attempt.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-lg font-semibold text-blue-600">{attempt.score || 'N/A'}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">
                        No quiz attempts found for this user.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <button
                    onClick={closeUserModal}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition duration-150 ease-in-out"
                  >
                    Close
                  </button>

                  <button
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition duration-150 ease-in-out"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;