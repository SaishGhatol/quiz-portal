import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowRight, FlaskConical, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import AuthContext from '../../contexts/AuthContext';
import { Avatar, Badge } from '../ui';

// Where each role lands after a one-click demo sign-in
const HOME = { admin: '/admin', org_admin: '/org', user: '/dashboard' };

/**
 * One-click sign-in for the seeded demo accounts. Renders nothing unless the API
 * runs in local demo mode (server/dev-mem-server.js), so credentials never ship in the client.
 */
const DemoAccounts = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    api.get('/dev/demo-accounts')
      .then(r => setAccounts(r.data.accounts || []))
      .catch(() => setAccounts([]));
  }, []);

  if (!accounts.length) return null;

  const signIn = async a => {
    setBusy(a.key);
    try {
      const user = await login(a.email, a.password);
      toast.success(`Signed in as ${a.label}`);
      navigate(HOME[user?.role] || '/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Demo sign-in failed');
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="demo-accounts-title"
      className="mt-6 bg-white dark:bg-gray-900 border border-dashed border-brand-300 dark:border-brand-500/40 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
        <h2 id="demo-accounts-title" className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-brand-500" aria-hidden="true" /> Try a demo account
        </h2>
        <Badge tone="brand">Local demo</Badge>
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {accounts.map(a => (
          <li key={a.key}>
            <button type="button" onClick={() => signIn(a)} disabled={!!busy}
              className="group w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 disabled:opacity-60">
              <Avatar name={a.name} size="sm" />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-gray-900 dark:text-white">{a.label}</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">{a.description}</span>
              </span>
              {busy === a.key
                ? <Loader2 className="h-4 w-4 animate-spin text-brand-500 shrink-0" aria-label="Signing in" />
                : <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-brand-500 shrink-0" aria-hidden="true" />}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default DemoAccounts;
