import React, { useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import AuthContext from '../../contexts/AuthContext';
import api from '../../utils/api';
import { User, Lock, Calendar, Shield, Info, ChevronDown, ChevronUp, Key, Save } from 'lucide-react';

const Profile = () => {
  const { currentUser, updateUser } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  
  useEffect(() => {
    // Update form data when currentUser changes
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || '',
        email: currentUser.email || ''
      }));
    }
  }, [currentUser]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    // Prepare data for profile update
    const updateData = {};
    
    if (formData.name !== currentUser.name) {
      updateData.name = formData.name;
    }
    
    // Don't update if nothing changed
    if (Object.keys(updateData).length === 0) {
      toast.info('No changes to update');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Make API call to update profile
      const response = await api.put(`/users/${currentUser.id}`, updateData);
      
      // Update user in context
      if (updateUser && typeof updateUser === 'function') {
        updateUser(response.data.user);
      }
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (!formData.currentPassword) {
      toast.error('Current password is required');
      return;
    }
    
    setIsPasswordChanging(true);
    
    try {
      // Make API call to change password
      await api.put(`/users/${currentUser.id}/password`, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      toast.success('Password changed successfully');
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      // Hide the password section after successful change
      setShowPasswordSection(false);
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsPasswordChanging(false);
    }
  };
  
  const togglePasswordSection = () => {
    setShowPasswordSection(!showPasswordSection);
  };
  
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Your Profile</h1>
        <p className="text-gray-600">Manage your account information and settings</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Details Section */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="border-b border-gray-100 p-4 flex items-center">
              <User className="h-5 w-5 text-blue-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Profile Details</h2>
            </div>
            
            <form onSubmit={handleProfileUpdate} className="p-6">
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="name">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    value={formData.email}
                    disabled
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Info className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed for security reasons</p>
              </div>
              
              <div className="flex flex-col space-y-3">
                <button
                  type="submit"
                  className="w-full flex justify-center items-center bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={togglePasswordSection}
                  className="w-full flex justify-center items-center bg-gray-100 text-gray-800 p-3 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                >
                  <Lock className="h-5 w-5 mr-2" />
                  {showPasswordSection ? 'Hide Password Section' : 'Change Password'}
                  {showPasswordSection ? (
                    <ChevronUp className="h-4 w-4 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-2" />
                  )}
                </button>
              </div>
            </form>
          </div>
          
          {/* Password Change Section - Conditionally rendered */}
          {showPasswordSection && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 transition-all duration-300">
              <div className="border-b border-gray-100 p-4 flex items-center">
                <Key className="h-5 w-5 text-green-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-800">Change Password</h2>
              </div>
              
              <form onSubmit={handlePasswordChange} className="p-6">
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="currentPassword">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="newPassword">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={formData.newPassword}
                    onChange={handleChange}
                    minLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    minLength={6}
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full flex justify-center items-center bg-green-600 text-white p-3 rounded-lg font-medium hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  disabled={isPasswordChanging}
                >
                  {isPasswordChanging ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Key className="h-5 w-5 mr-2" />
                      Update Password
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="border-b border-gray-100 p-4 flex items-center">
              <Info className="h-5 w-5 text-amber-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Account Info</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Account Type</p>
                  <p className="font-medium text-gray-800">
                    {currentUser.role === 'admin' ? 'Administrator' : 'Standard User'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium text-gray-800">
                    {currentUser.createdAt 
                      ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;