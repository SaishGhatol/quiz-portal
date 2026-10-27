import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../../contexts/AuthContext';
import api from '../../utils/api';
import { PasswordToggle } from '../auth/AuthLayout';
import { Page, PageHeader, Card, CardHeader, Input, inputClass, Button, Avatar, Badge, Modal, Spinner } from '../ui';
import { User, Lock, Star, AlertTriangle, Save, Camera, Trash2, KeyRound, Send } from 'lucide-react';

const TABS = [
  { key: 'profile',  label: 'Profile',     icon: User },
  { key: 'security', label: 'Security',    icon: Lock },
  { key: 'review',   label: 'My Review',   icon: Star },
  { key: 'danger',   label: 'Danger Zone', icon: AlertTriangle },
];

const PW_FIELDS = [
  { field: 'currentPassword', label: 'Current password',     auto: 'current-password' },
  { field: 'newPassword',     label: 'New password',         auto: 'new-password', hint: 'At least 6 characters.' },
  { field: 'confirmPassword', label: 'Confirm new password', auto: 'new-password' },
];

const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

const ROLE_LABELS = { user: 'Student', admin: 'Administrator', org_admin: 'Institute admin', teacher: 'Teacher' };
const roleLabel = r => ROLE_LABELS[r] || (r || '').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());

// Footer row shared by the form cards
const CardFooter = ({ children }) => (
  <div className="px-5 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60 flex justify-end">
    {children}
  </div>
);

// Crops to a centred square and shrinks to 256px JPEG, so the photo is small enough to store on the profile
const toAvatarDataUrl = file => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => {
    const side = Math.min(img.width, img.height);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    canvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256);
    URL.revokeObjectURL(img.src);
    resolve(canvas.toDataURL('image/jpeg', 0.85));
  };
  img.onerror = () => reject(new Error('Could not read that image'));
  img.src = URL.createObjectURL(file);
});

const Profile = () => {
  const { currentUser, updateProfile, changePassword, deleteAccount } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [tab,     setTab]     = useState('profile');
  const [loading, setLoading] = useState({});
  const [showPw,  setShowPw]  = useState({});

  const [name,    setName]    = useState('');
  const [pwData,  setPwData]  = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwTried, setPwTried] = useState(false);
  const [review,  setReview]  = useState({ rating: 0, role: '', content: '' });
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
    setPwTried(true);
    if (pwData.newPassword !== pwData.confirmPassword) return toast.error("Passwords don't match");
    if (pwData.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    load('password');
    try {
      await changePassword(currentUser.id, pwData);
      toast.success('Password updated');
      setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwTried(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { done('password'); }
  };

  const handleReviewSubmit = async e => {
    e.preventDefault();
    if (!review.rating) return toast.error('Please select a rating');
    if (!review.role.trim()) return toast.error('Please enter your role');
    load('review');
    try {
      const { data } = await api.post('/reviews', { role: review.role.trim(), quote: review.content, rating: review.rating });
      toast.success(data?.message || 'Thanks! Your review will appear once an admin approves it.');
      setReview({ rating: 0, role: '', content: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      done('review');
    }
  };

  const handleImageChange = e => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast.error('Select a valid image');
    if (f.size > 8 * 1024 * 1024) return toast.error('Image max 8 MB');
    setImgFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const cancelImage = () => {
    setPreview(null); setImgFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDeleteAccount = async () => {
    load('delete');
    try {
      await deleteAccount();
      toast.success('Your account has been deleted.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
      done('delete');
    }
  };

  const handleImageUpload = async () => {
    if (!imgFile) return;
    load('avatar');
    try {
      await updateProfile(currentUser.id, { profilePicture: await toAvatarDataUrl(imgFile) });
      toast.success('Profile picture updated');
      cancelImage();
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { done('avatar'); }
  };

  const handleImageRemove = async () => {
    load('avatar');
    try {
      await updateProfile(currentUser.id, { profilePicture: '' });
      toast.success('Profile picture removed');
    } catch (err) { toast.error(err.response?.data?.message || 'Could not remove photo'); }
    finally { done('avatar'); }
  };

  if (!currentUser) return <Page width="md"><Spinner label="Loading your account" /></Page>;

  // Inline password errors, shown after the first submit attempt (the toasts remain)
  const pwErrors = {
    newPassword: pwTried && pwData.newPassword.length < 6 ? 'Password must be at least 6 characters' : undefined,
    confirmPassword: pwData.confirmPassword && pwData.newPassword !== pwData.confirmPassword && (pwTried || pwData.confirmPassword.length >= pwData.newPassword.length)
      ? "Passwords don't match" : undefined,
  };

  return (
    <Page width="md">
      <PageHeader eyebrow="Account" title="Account settings" description="Manage your profile, password and feedback." />

      <div className="flex flex-col md:flex-row gap-6">

        {/* Section nav: horizontal strip on mobile, sidebar from md */}
        <aside className="md:w-56 shrink-0">
          <div className="hidden md:flex items-center gap-3 mb-4 px-1">
            <Avatar name={currentUser.name} src={currentUser.profilePicture} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
            </div>
          </div>
          <nav role="tablist" aria-label="Account sections"
            className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:p-1.5 md:bg-white md:dark:bg-gray-900 md:border md:border-gray-200/80 md:dark:border-gray-800 md:rounded-2xl md:shadow-card">
            {TABS.map(t => {
              const active = tab === t.key;
              const danger = t.key === 'danger';
              return (
                <button key={t.key} type="button" role="tab" id={`tab-${t.key}`} aria-selected={active} aria-controls={`panel-${t.key}`}
                  onClick={() => setTab(t.key)}
                  className={`shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left whitespace-nowrap border md:border-0
                    ${active
                      ? danger
                        ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'
                        : 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-500/20'
                      : `bg-white dark:bg-gray-900 md:bg-transparent md:dark:bg-transparent border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 ${danger ? 'hover:text-red-600 dark:hover:text-red-400' : 'hover:text-gray-900 dark:hover:text-white'}`}`}>
                  <t.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>

          {/* Profile */}
          {tab === 'profile' && (
            <Card as="form" padding={false} onSubmit={handleProfileSave} className="animate-fade-up">
              <CardHeader title="Personal information" subtitle="How you appear on leaderboards and to your teachers." />
              <div className="p-5 sm:p-6 space-y-5">
                {/* Avatar */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="relative w-14 h-14 shrink-0">
                    {preview
                      ? <img src={preview} alt="New profile photo preview" className="w-14 h-14 rounded-full object-cover ring-2 ring-brand-500/30" />
                      : <Avatar name={currentUser.name} src={currentUser.profilePicture} size="lg" />}
                    <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-card" aria-hidden="true">
                      <Camera className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Profile photo</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">PNG, JPG or WebP. We crop it to a square.</p>
                    <input ref={fileRef} type="file" id="avatar-upload" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} />
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {preview ? (
                        <>
                          <Button size="sm" onClick={handleImageUpload} loading={loading.avatar}>Save photo</Button>
                          <Button size="sm" variant="secondary" onClick={cancelImage} disabled={loading.avatar}>Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="secondary" icon={Camera} onClick={() => fileRef.current?.click()}>
                            {currentUser.profilePicture ? 'Change photo' : 'Upload photo'}
                          </Button>
                          {currentUser.profilePicture && (
                            <Button size="sm" variant="ghost" onClick={handleImageRemove} loading={loading.avatar}>Remove</Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800" />

                <Input id="profile-name" label="Full name" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
                <Input id="profile-email" label="Email address" type="email" value={currentUser.email} disabled hint="Email cannot be changed." />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Account type</p>
                  <Badge tone="brand">{roleLabel(currentUser.role)}</Badge>
                </div>
              </div>
              <CardFooter>
                <Button type="submit" icon={Save} loading={loading.profile} disabled={name === currentUser.name}>
                  Save changes
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Security */}
          {tab === 'security' && (
            <Card as="form" padding={false} onSubmit={handlePasswordSave} className="animate-fade-up">
              <CardHeader title="Change password" subtitle="Choose a strong password you don't use elsewhere." />
              <div className="p-5 sm:p-6 space-y-5">
                {PW_FIELDS.map(({ field, label, auto, hint }) => (
                  <Input key={field} id={`pw-${field}`} label={label} icon={KeyRound}
                    type={showPw[field] ? 'text' : 'password'} required autoComplete={auto}
                    value={pwData[field]}
                    onChange={e => setPwData(p => ({ ...p, [field]: e.target.value }))}
                    error={pwErrors[field]} hint={hint}
                    trailing={<PasswordToggle shown={!!showPw[field]} onToggle={() => setShowPw(p => ({ ...p, [field]: !p[field] }))} />}
                  />
                ))}
              </div>
              <CardFooter>
                <Button type="submit" icon={Lock} loading={loading.password}>Update password</Button>
              </CardFooter>
            </Card>
          )}

          {/* Review */}
          {tab === 'review' && (
            <Card as="form" padding={false} onSubmit={handleReviewSubmit} className="animate-fade-up">
              <CardHeader title="Share your feedback" subtitle="Reviews appear on the ExamVault homepage." />
              <div className="p-5 sm:p-6 space-y-5">
                <div>
                  <p id="rating-label" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</p>
                  <div role="radiogroup" aria-labelledby="rating-label" className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} type="button" role="radio" aria-checked={review.rating === s}
                        aria-label={`${s} star${s > 1 ? 's' : ''} — ${RATING_LABELS[s - 1]}`}
                        onClick={() => setReview(p => ({ ...p, rating: s }))}
                        className="p-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10">
                        <Star aria-hidden="true"
                          className={`h-7 w-7 ${review.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
                      {review.rating ? RATING_LABELS[review.rating - 1] : 'Select a rating'}
                    </span>
                  </div>
                </div>
                <Input id="review-role" label="Your role" required value={review.role}
                  onChange={e => setReview(p => ({ ...p, role: e.target.value }))}
                  placeholder="e.g. B.Sc. Student, Teacher, L&D Manager…" />
                <div>
                  <label htmlFor="review-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Your review</label>
                  <textarea id="review-content" required rows={4} value={review.content}
                    onChange={e => setReview(p => ({ ...p, content: e.target.value }))}
                    placeholder="Tell us what you think about ExamVault…"
                    className={`${inputClass} h-auto py-3 resize-none`} />
                </div>
              </div>
              <CardFooter>
                <Button type="submit" icon={Send} loading={loading.review} disabled={!review.rating}>Submit review</Button>
              </CardFooter>
            </Card>
          )}

          {/* Danger zone */}
          {tab === 'danger' && (
            <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-500/30 rounded-2xl shadow-card overflow-hidden animate-fade-up">
              <div className="px-5 sm:px-6 py-4 border-b border-red-100 dark:border-red-500/20 bg-red-50/70 dark:bg-red-500/5">
                <h2 className="text-[15px] font-bold text-red-700 dark:text-red-400">Danger zone</h2>
                <p className="text-xs text-red-600/90 dark:text-red-400/80 mt-0.5">These actions are permanent and cannot be undone.</p>
              </div>
              <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Delete my account</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Permanently remove your account, attempts and results.</p>
                </div>
                <Button variant="danger" icon={Trash2} onClick={() => setDelConfirm(true)} className="shrink-0">
                  Delete account
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={delConfirm}
        onClose={() => setDelConfirm(false)}
        dismissible={!loading.delete}
        size="sm"
        title="Delete your account?"
        description="This permanently removes your profile and all quiz attempts. You can't undo this."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDelConfirm(false)} disabled={loading.delete}>Cancel</Button>
            <Button variant="danger" icon={Trash2} onClick={handleDeleteAccount} loading={loading.delete}>
              {loading.delete ? 'Deleting…' : 'Confirm delete'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          You're signed in as <span className="font-semibold text-gray-900 dark:text-white">{currentUser.email}</span>.
        </p>
      </Modal>
    </Page>
  );
};

export default Profile;
