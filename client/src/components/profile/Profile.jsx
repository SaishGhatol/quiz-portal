import React, { useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import AuthContext from '../../contexts/AuthContext';
import api from '../../utils/api';
import { User, Lock, Calendar, Shield, Save, Eye, EyeOff, Loader, Trash2, AlertTriangle, Star, Camera } from 'lucide-react';

const Profile = () => {
  const { currentUser, updateUser, deleteUser, logout } = useContext(AuthContext); 

  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [testimonial, setTestimonial] = useState({ rating: 0, content: '' });
  
  // New state for profile picture
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  const [loading, setLoading] = useState({ profile: false, password: false, delete: false, testimonial: false, avatar: false });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({ name: currentUser.name || '', email: currentUser.email || '' });
    }
  }, [currentUser]);

  // Handle file selection for avatar
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast.error('Image is too large. Max size is 2MB.', { theme: 'dark' });
            return;
        }
        setProfileImageFile(file);
        setProfileImagePreview(URL.createObjectURL(file));
    } else {
        toast.error('Please select a valid image file.', { theme: 'dark' });
    }
  };

  // Handle avatar upload to server
  const handleImageUpload = async () => {
    if (!profileImageFile) return;
    setLoading(p => ({ ...p, avatar: true }));
    const uploadFormData = new FormData();
    uploadFormData.append('profilePicture', profileImageFile);

    try {
        const response = await api.put(`/users/${currentUser.id}/avatar`, uploadFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (updateUser) updateUser(response.data.user);
        toast.success('Profile picture updated successfully!', { theme: 'dark' });
        setProfileImageFile(null);
        setProfileImagePreview(null);
    } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to upload image.', { theme: 'dark' });
    } finally {
        setLoading(p => ({ ...p, avatar: false }));
    }
  };


  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (formData.name === currentUser.name) return toast.info('No changes to save.', { theme: 'dark' });
    setLoading(p => ({ ...p, profile: true }));
    try {
      const response = await api.put(`/users/${currentUser.id}`, { name: formData.name });
      if (updateUser) updateUser(response.data.user);
      toast.success('Profile updated successfully!', { theme: 'dark' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile.', { theme: 'dark' });
    } finally {
      setLoading(p => ({ ...p, profile: false }));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) return toast.error('New passwords do not match.', { theme: 'dark' });
    if (passwordData.newPassword.length < 6) return toast.error('New password must be at least 6 characters.', { theme: 'dark' });
    setLoading(p => ({ ...p, password: true }));
    try {
      await api.put(`/users/${currentUser.id}/password`, passwordData);
      toast.success('Password changed successfully!', { theme: 'dark' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password.', { theme: 'dark' });
    } finally {
      setLoading(p => ({ ...p, password: false }));
    }
  };

  const handleTestimonialSubmit = async (e) => {
    e.preventDefault();
    setLoading(p => ({ ...p, testimonial: true }));
    await new Promise(res => setTimeout(res, 1000)); // Simulate API call
    toast.success('Thank you for your feedback!', { theme: 'dark' });
    setTestimonial({ rating: 0, content: '' });
    setLoading(p => ({ ...p, testimonial: false }));
  };

  const handleDeleteUser = async () => {  
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    setLoading(p => ({ ...p, delete: true }));
    try {
      await deleteUser(currentUser.id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting user", { theme: 'dark' });
      setLoading(p => ({ ...p, delete: false }));
    } 
  };
 

  if (!currentUser) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader className="animate-spin h-8 w-8 text-gray-500"/></div>;
  }
  
  const NavLink = ({ tabName, children }) => (
    <button onClick={() => setActiveTab(tabName)} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === tabName ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-900'}`}>
      {children}
    </button>
  );

  const PasswordInput = ({ id, value, placeholder, isVisible, onToggle, onChange }) => (
    <div className="relative">
      <input id={id} name={id} type={isVisible ? 'text' : 'password'} value={value} onChange={onChange} required minLength={6}
        className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent pr-10"/>
      <label htmlFor={id} className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs">{placeholder}</label>
      <button type="button" onClick={onToggle} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white">
        {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-white">Account Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account and security preferences.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <nav className="space-y-1 bg-gray-950 border border-gray-800 p-2 rounded-xl">
            <NavLink tabName="profile"><User size={16} /> Profile</NavLink>
            <NavLink tabName="security"><Lock size={16} /> Security</NavLink>
            <NavLink tabName="review"><Star size={16} /> My Review</NavLink>
            <NavLink tabName="danger"><AlertTriangle size={16} /> Danger Zone</NavLink>
          </nav>
        </aside>

        <main className="md:col-span-3">
          <section className={`${activeTab === 'profile' ? 'block' : 'hidden'}`}>
            <form onSubmit={handleProfileUpdate} className="bg-gray-950 border border-gray-800 rounded-2xl">
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-semibold text-white">Personal Information</h2>
                <p className="text-sm text-gray-400 mt-1">Update your public profile details.</p>
              </div>
              <div className="p-6 space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="relative group w-20 h-20">
                        <img 
                            src={profileImagePreview || currentUser.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}&backgroundColor=000000&textColor=ffffff`} 
                            alt="Avatar" 
                            className="w-20 h-20 rounded-full border-2 border-gray-700 object-cover"
                        />
                         <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Camera size={24} />
                            <input type="file" id="avatar-upload" className="hidden" accept="image/png, image/jpeg" onChange={handleProfileImageChange} />
                         </label>
                    </div>
                    <div>
                        <p className="font-semibold text-white">{currentUser.name}</p>
                        <p className="text-sm text-gray-500">Update your profile picture.</p>
                        {profileImagePreview && (
                            <div className="flex items-center gap-2 mt-2">
                                <button type="button" onClick={handleImageUpload} disabled={loading.avatar} className="px-3 py-1 bg-white text-black rounded-md font-semibold text-xs hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1">
                                    {loading.avatar ? <><Loader className="animate-spin h-3 w-3"/> Saving...</> : 'Save Photo'}
                                </button>
                                <button type="button" onClick={() => setProfileImagePreview(null)} className="px-3 py-1 bg-gray-800 text-white rounded-md font-semibold text-xs hover:bg-gray-700">Cancel</button>
                            </div>
                        )}
                    </div>
                 </div>
                <div className="relative">
                  <input id="name" name="name" type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent"/>
                  <label htmlFor="name" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs">Full Name</label>
                </div>
                <div className="relative">
                  <input id="email" type="email" value={formData.email} disabled className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-gray-500 cursor-not-allowed"/>
                  <label htmlFor="email" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-gray-950 px-1">Email (cannot be changed)</label>
                </div>
              </div>
              <footer className="p-6 border-t border-gray-800 flex justify-end bg-gray-950/50 rounded-b-2xl">
                <button type="submit" disabled={loading.profile} className="px-5 py-2.5 bg-white text-black rounded-lg font-semibold text-sm hover:bg-gray-200 transition disabled:opacity-50 flex items-center gap-2">
                  {loading.profile ? <><Loader className="animate-spin h-4 w-4"/> Saving...</> : <><Save size={16}/> Save Changes</>}
                </button>
              </footer>
            </form>
          </section>

          {/* Security Section */}
          <section className={`${activeTab === 'security' ? 'block' : 'hidden'}`}>
            <form onSubmit={handlePasswordChange} className="bg-gray-950 border border-gray-800 rounded-2xl">
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-semibold text-white">Password</h2>
                <p className="text-sm text-gray-400 mt-1">Update your password. Make sure it's a strong one.</p>
              </div>
              <div className="p-6 space-y-6">
                <PasswordInput id="currentPassword" value={passwordData.currentPassword} placeholder="Current Password" isVisible={showPassword.current} onToggle={() => setShowPassword(p => ({...p, current: !p.current}))} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} />
                <PasswordInput id="newPassword" value={passwordData.newPassword} placeholder="New Password" isVisible={showPassword.new} onToggle={() => setShowPassword(p => ({...p, new: !p.new}))} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} />
                <PasswordInput id="confirmPassword" value={passwordData.confirmPassword} placeholder="Confirm New Password" isVisible={showPassword.confirm} onToggle={() => setShowPassword(p => ({...p, confirm: !p.confirm}))} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} />
              </div>
              <footer className="p-6 border-t border-gray-800 flex justify-end bg-gray-950/50 rounded-b-2xl">
                <button type="submit" disabled={loading.password} className="px-5 py-2.5 bg-white text-black rounded-lg font-semibold text-sm hover:bg-gray-200 transition disabled:opacity-50 flex items-center gap-2">
                  {loading.password ? <><Loader className="animate-spin h-4 w-4"/> Updating...</> : <>Update Password</>}
                </button>
              </footer>
            </form>
          </section>
          
           {/* My Review Section */}
           <section className={`${activeTab === 'review' ? 'block' : 'hidden'}`}>
             <form onSubmit={handleTestimonialSubmit} className="bg-gray-950 border border-gray-800 rounded-2xl">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-semibold text-white">Share Your Experience</h2>
                    <p className="text-sm text-gray-400 mt-1">Help others in the community by sharing your feedback on the platform.</p>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Your Rating</label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button type="button" key={star} onClick={() => setTestimonial({...testimonial, rating: star})}>
                            <Star className={`h-8 w-8 transition-colors ${testimonial.rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`} />
                          </button>
                        ))}
                      </div>
                  </div>
                   <div className="relative">
                    <textarea id="content" name="content" value={testimonial.content} onChange={(e) => setTestimonial({...testimonial, content: e.target.value})} rows="4" className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent" placeholder="Your review" required/>
                    <label htmlFor="content" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs">Your review</label>
                   </div>
                </div>
                 <footer className="p-6 border-t border-gray-800 flex justify-end bg-gray-950/50 rounded-b-2xl">
                    <button type="submit" disabled={loading.testimonial} className="px-5 py-2.5 bg-white text-black rounded-lg font-semibold text-sm hover:bg-gray-200 transition disabled:opacity-50 flex items-center gap-2">
                        {loading.testimonial ? <><Loader className="animate-spin h-4 w-4"/> Submitting...</> : <>Submit Review</>}
                    </button>
                 </footer>
             </form>
           </section>

           {/* Danger Zone Section */}
           <section className={`${activeTab === 'danger' ? 'block' : 'hidden'}`}>
             <div className="bg-gray-950 border border-red-500/30 rounded-2xl">
                <div className="p-6 border-b border-red-500/30">
                    <h2 className="text-xl font-semibold text-red-400">Danger Zone</h2>
                    <p className="text-sm text-gray-400 mt-1">These actions are permanent and cannot be undone.</p>
                </div>
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                        <p className="font-semibold text-white">Delete Account</p>
                        <p className="text-sm text-gray-400 mt-1">Permanently remove your account and all associated data.</p>
                    </div>
                     <button onClick={handleDeleteUser} disabled={loading.delete} className="mt-4 md:mt-0 px-5 py-2.5 bg-red-600/20 text-red-400 border border-red-500/50 rounded-lg font-semibold text-sm hover:bg-red-600/30 hover:text-white transition disabled:opacity-50">
                        {loading.delete ? 'Deleting...' : 'Delete My Account'}
                     </button>
                </div>
             </div>
           </section>
        </main>
      </div>
    </div>
  );
};

export default Profile;

