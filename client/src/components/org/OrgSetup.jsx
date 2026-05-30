import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useOrg } from '../../contexts/OrgContext';
import AuthContext from '../../contexts/AuthContext';
import { Building2, Loader, ArrowRight } from 'lucide-react';

const TYPES = ['tuition', 'school', 'college', 'corporate', 'university', 'other'];

const inp = 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

const OrgSetup = () => {
  const navigate              = useNavigate();
  const { refreshOrg }        = useOrg();
  const { applyNewToken }     = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'tuition', contactEmail: '', description: '',
    website: '', address: '', phone: ''
  });

  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim())         return toast.error('Organisation name is required');
    if (!form.contactEmail.trim()) return toast.error('Contact email is required');
    setLoading(true);
    try {
      const res = await api.post('/org/setup', form);
      // Server returns a NEW token with role=org_admin — apply it immediately
      if (res.data.token) applyNewToken(res.data.token, res.data.user);
      await refreshOrg();
      toast.success('Organisation created! Welcome to your dashboard.');
      navigate('/org');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create organisation');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl mb-4">
            <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Set up your organisation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create your tuition or institute profile to manage students and quizzes.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organisation name *</label>
                <input name="name" required value={form.name} onChange={change}
                  placeholder="e.g. Sunrise Tuition Centre" className={inp} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select name="type" value={form.type} onChange={change}
                  className={inp}>
                  {TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact email *</label>
                <input name="contactEmail" type="email" required value={form.contactEmail} onChange={change}
                  placeholder="admin@example.com" className={inp} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input name="phone" value={form.phone} onChange={change}
                  placeholder="+91 9876543210" className={inp} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                <input name="website" value={form.website} onChange={change}
                  placeholder="https://..." className={inp} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <input name="address" value={form.address} onChange={change}
                  placeholder="Full address" className={inp} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea name="description" rows={3} value={form.description} onChange={change}
                  placeholder="Brief description of your organisation…"
                  className={`${inp} resize-none`} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">
              {loading
                ? <><Loader className="h-4 w-4 animate-spin" /> Creating…</>
                : <><ArrowRight className="h-4 w-4" /> Create Organisation</>}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Already have an invite code?{' '}
          <Link to="/org/join" className="text-indigo-600 dark:text-indigo-400 hover:underline">Join an existing org</Link>
        </p>
      </div>
    </div>
  );
};

export default OrgSetup;
