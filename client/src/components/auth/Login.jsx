import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../../contexts/AuthContext';
import AuthLayout, { PasswordToggle } from './AuthLayout';
import DemoAccounts from './DemoAccounts';
import { Button, Input } from '../ui';
import { LogIn, Mail, Lock, Clock } from 'lucide-react';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/dashboard';

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  const isExpired = new URLSearchParams(location.search).get('reason') === 'session_expired';

  return (
    <AuthLayout>
      <div className="mb-7 text-center lg:text-left">
        <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 dark:text-white">Welcome back</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">Sign in to pick up where you left off.</p>
      </div>

      {isExpired && (
        <div role="status" className="mb-4 flex items-start gap-2.5 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
          <Clock className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          Your session expired. Please sign in again.
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card p-6 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="login-email"
            label="Email"
            icon={Mail}
            name="email" type="email" required autoComplete="email"
            value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            placeholder="you@example.com"
          />

          <Input
            id="login-password"
            label="Password"
            icon={Lock}
            labelAction={
              <Link to="/contact" className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline rounded">
                Forgot password?
              </Link>
            }
            name="password" type={showPw ? 'text' : 'password'} required autoComplete="current-password"
            value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            placeholder="••••••••"
            trailing={<PasswordToggle shown={showPw} onToggle={() => setShowPw(o => !o)} />}
          />

          <Button type="submit" size="lg" fullWidth loading={loading} icon={LogIn}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>

      {/* Dev builds only; the component itself also hides unless the API is in demo mode */}
      {import.meta.env.DEV && <DemoAccounts />}

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        New to ExamVault?{' '}
        <Link to="/register" state={location.state} className="font-semibold text-brand-600 dark:text-brand-400 hover:underline rounded">Create a free account</Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
