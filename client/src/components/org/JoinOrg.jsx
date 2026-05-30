import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useOrg } from '../../contexts/OrgContext';
import AuthContext from '../../contexts/AuthContext';
import { Users, Loader } from 'lucide-react';

const JoinOrg = () => {
  const navigate              = useNavigate();
  const { refreshOrg }        = useOrg();
  const { applyNewToken }     = useContext(AuthContext);
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (code.trim().length !== 6) { toast.error('Invite code must be 6 characters'); return; }
    setLoading(true);
    try {
      const res = await api.post('/org/join', { inviteCode: code.trim().toUpperCase() });
      // Server returns a new token with updated orgId — apply immediately
      if (res.data.token) applyNewToken(res.data.token, res.data.user);
      await refreshOrg();
      toast.success(`Joined ${res.data.org?.name || 'organisation'} successfully!`);
      navigate('/my-assignments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid invite code');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl mb-4">
            <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Join an organisation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Enter the 6-character invite code your admin shared with you.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Invite code
              </label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                maxLength={6}
                placeholder="A3F9C2"
                autoFocus
                className="w-full px-4 py-3 text-center text-2xl font-mono font-bold tracking-[0.35em] bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-indigo-700 dark:text-indigo-300 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
              />
              <p className="text-xs text-gray-400 text-center mt-1.5">{code.length} / 6 characters</p>
            </div>

            <button type="submit" disabled={loading || code.length !== 6}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading && <Loader className="h-4 w-4 animate-spin" />}
              {loading ? 'Joining…' : 'Join Organisation'}
            </button>
          </form>
        </div>

        <div className="text-center mt-4 space-y-1.5">
          <p className="text-xs text-gray-400">Don't have a code? Ask your organisation admin.</p>
          <p className="text-xs text-gray-400">
            Want to create your own?{' '}
            <Link to="/org/setup" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              Set up an organisation
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinOrg;
