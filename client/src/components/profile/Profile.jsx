import React, { useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import AuthContext from '../../contexts/AuthContext';
import api from '../../utils/api';
import { User, Lock, Star, AlertTriangle, Save, Eye, EyeOff, Loader, Camera } from 'lucide-react';

const TABS = [
  { key: 'profile',  label: 'Profile',     icon: User },
  { key: 'security', label: 'Security',    icon: Lock },
  { key: 'review',   label: 'My Review',   icon: Star },
  { key: 'danger',   label: 'Danger Zone', icon: AlertTriangle },
];

const inputCls = 'w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

const Profile = () => {
  const { currentUser, updateProfile, changePassword } = useContext(AuthContext);

  const [tab,     setTab]     = useState('profile');
  const [loading, setLoading] = useState({});
  const [showPw,  setShowPw]  = useState({});

  const [name,    setName]    = useState('');
  const [pwData,  setPwData]  = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [review,  setReview]  = useState({ rating: 0, content: '' });
  const [preview, setPreview] = useState(null);
  const [imgFile, setImgFile] = useState(null);
  const [delConfirm, setDelConfirm] = useState(false);

  useEffect(() => { if (currentUser) setName(currentUser.name || ''); }, [currentUser]);

  const load = key => setLoading(p => ({ ...p, [key]: true }));
  const done = key => setLoading(p => ({ ...p, [key]: false }));

  const handleProfileSave = async e => {
    e.preventDefault();
    if (name === currentUser.name) return;
    load('profile');
    try {
      await updateProfile(currentUser.id, { name });
      toast.success('Profile updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { done('profile'); }
  };

  const handlePasswordSave = async e => {
    e.preventDefault();
    if (pwData.newPassword !== pwData.confirmPassword) return toast.error("Passwords don't match");
    if (pwData.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    load('password');
    try {
      await changePassword(currentUser.id, pwData);
      toast.success('Password updated');
      setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { done('password'); }
  };

  const handleReviewSubmit = async e => {
    e.preventDefault();
    load('review');
    await new Promise(r => setTimeout(r, 800));
    toast.success('Thanks for your feedback!');
    setReview({ rating: 0, content: '' });
    done('review');
  };

  const handleImageChange = e => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast.error('Select a valid image');
    if (f.size > 2 * 1024 * 1024) return toast.error('Image max 2 MB');
    setImgFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleImageUpload = async () => {
    if (!imgFile) return;
    load('avatar');
    const fd = new FormData();
    fd.append('profilePicture', imgFile);
    try {
      await api.put(`/users/${currentUser.id}/avatar`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Profile picture updated');
      setImgFile(null); setPreview(null);
    } catch { toast.error('Upload failed'); }
    finally { done('avatar'); }
  };

  if (!currentUser) return <div className="flex justify-center items-center min-h-[50vh]"><Loader className="animate-spin h-6 w-6 text-indigo-500" /></div>;

  const PwField = ({ field, label }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <div className="relative">
        <input type={showPw[field] ? 'text' : 'password'} required value={pwData[field]}
          onChange={e => setPwData(p => ({ ...p, [field]: e.target.value }))}
          className={`${inputCls} pr-10`} />
        <button type="button" onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {showPw[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your profile and security preferences.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">

          {/* Sidebar tabs */}
          <aside className="md:w-48 shrink-0">
            <nav className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-2 space-y-0.5">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left
                    ${tab === t.key
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : `text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 ${t.key === 'danger' ? 'hover:text-red-600 dark:hover:text-red-400' : 'hover:text-gray-900 dark:hover:text-white'}`}`}>
                  <t.icon className="h-4 w-4 shrink-0" />
                  {t.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* Profile */}
            {tab === 'profile' && (
              <form onSubmit={handleProfileSave} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="font-bold text-gray-900 dark:text-white">Personal Information</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Update your public profile details.</p>
                </div>
                <div className="p-6 space-y-5">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="relative group w-16 h-16 shrink-0">
                      <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-indigo-400 overflow-hidden">
                        {preview
                          ? <img src={preview} alt="" className="w-full h-full object-cover" />
                          : <span>{currentUser.name?.[0]?.toUpperCase()}</span>}
                      </div>
                      <label htmlFor="avatar-upload"
                        className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="h-5 w-5" />
                        <input type="file" id="avatar-upload" className="hidden" accept="image/png,image/jpeg" onChange={handleImageChange} />
                      </label>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{currentUser.name}</p>
                      <p className="text-xs text-gray-400">Click avatar to change photo (max 2 MB)</p>
                      {preview && (
                        <div className="flex gap-2 mt-2">
                          <button type="button" onClick={handleImageUpload} disabled={loading.avatar}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 disabled:opacity-60">
                            {loading.avatar ? <Loader className="h-3 w-3 animate-spin" /> : null} Save
                          </button>
                          <button type="button" onClick={() => { setPreview(null); setImgFile(null); }}
                            className="px-3 py-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full name</label>
                    <input value={name} onChange={e => setName(e.target.value)} required className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
                    <input value={currentUser.email} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                    <div className="px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {currentUser.role}
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end bg-gray-50 dark:bg-gray-800/30">
                  <button type="submit" disabled={loading.profile || name === currentUser.name}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                    {loading.profile ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save changes
                  </button>
                </div>
              </form>
            )}

            {/* Security */}
            {tab === 'security' && (
              <form onSubmit={handlePasswordSave} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="font-bold text-gray-900 dark:text-white">Change Password</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Choose a strong, unique password.</p>
                </div>
                <div className="p-6 space-y-4">
                  <PwField field="currentPassword"  label="Current password" />
                  <PwField field="newPassword"       label="New password (min. 6 chars)" />
                  <PwField field="confirmPassword"   label="Confirm new password" />
                </div>
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end bg-gray-50 dark:bg-gray-800/30">
                  <button type="submit" disabled={loading.password}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                    {loading.password ? <Loader className="h-4 w-4 animate-spin" /> : null}
                    Update password
                  </button>
                </div>
              </form>
            )}

            {/* Review */}
            {tab === 'review' && (
              <form onSubmit={handleReviewSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="font-bold text-gray-900 dark:text-white">Share Your Feedback</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Your review helps improve the platform.</p>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} type="button" onClick={() => setReview(p => ({ ...p, rating: s }))}>
                          <Star className={`h-7 w-7 transition-colors ${review.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600 hover:text-amber-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your review</label>
                    <textarea required rows={4} value={review.content}
                      onChange={e => setReview(p => ({ ...p, content: e.target.value }))}
                      placeholder="Tell us what you think about ExamVault…"
                      className={`${inputCls} resize-none`} />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end bg-gray-50 dark:bg-gray-800/30">
                  <button type="submit" disabled={loading.review || !review.rating}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                    {loading.review ? <Loader className="h-4 w-4 animate-spin" /> : null} Submit review
                  </button>
                </div>
              </form>
            )}

            {/* Danger zone */}
            {tab === 'danger' && (
              <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/40 rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10">
                  <h2 className="font-bold text-red-700 dark:text-red-400">Danger Zone</h2>
                  <p className="text-sm text-red-600 dark:text-red-500 mt-0.5">These actions are permanent and cannot be undone.</p>
                </div>
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Delete my account</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Permanently remove your account and all associated data.</p>
                  </div>
                  {!delConfirm ? (
                    <button onClick={() => setDelConfirm(true)}
                      className="shrink-0 px-5 py-2.5 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-semibold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      Delete account
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDelConfirm(false)}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        Cancel
                      </button>
                      <button disabled={loading.delete}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60">
                        {loading.delete ? 'Deleting…' : 'Confirm delete'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
