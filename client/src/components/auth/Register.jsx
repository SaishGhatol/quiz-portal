import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../../contexts/AuthContext';
import AuthLayout, { PasswordToggle } from './AuthLayout';
import { Button, Input } from '../ui';
import { UserPlus, Check, Circle, User, Mail, Lock } from 'lucide-react';

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate     = useNavigate();
  const location     = useLocation();
  // Return people to the page that sent them here (e.g. a quiz they tried to open)
  const from         = location.state?.from?.pathname || '/dashboard';

  const [form,      setForm]      = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  // Inline errors appear once the user leaves a field or tries to submit
  const [touched,   setTouched]   = useState({});
  const [submitted, setSubmitted] = useState(false);

  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const blur   = e => setTouched(p => ({ ...p, [e.target.name]: true }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitted(true);
    if (form.password !== form.confirm)   { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6)         { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const pwMatch  = !form.confirm || form.confirm === form.password;
  const pwLength = form.password.length >= 6;

  const showPwError = (submitted || touched.password) && !pwLength;
  const pwError = showPwError ? 'Password must be at least 6 characters' : undefined;
  const confirmError = !pwMatch && (submitted || touched.confirm || form.confirm.length >= form.password.length)
    ? "Passwords don't match"
    : undefined;

  // Live requirement check while typing, before any error is shown
  const pwHint = form.password ? (
    <span className={`inline-flex items-center gap-1 ${pwLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
      {pwLength ? <Check className="h-3 w-3" aria-hidden="true" /> : <Circle className="h-3 w-3" aria-hidden="true" />}
      At least 6 characters
    </span>
  ) : 'Use at least 6 characters.';

  return (
    <AuthLayout>
      <div className="mb-7 text-center lg:text-left">
        <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 dark:text-white">Create your account</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">Free forever for students. No credit card needed.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card p-6 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="register-name" label="Full name" icon={User}
            name="name" type="text" required autoComplete="name"
            value={form.name} onChange={change} placeholder="Your name"
          />

          <Input
            id="register-email" label="Email" icon={Mail}
            name="email" type="email" required autoComplete="email"
            value={form.email} onChange={change} placeholder="you@example.com"
          />

          <Input
            id="register-password" label="Password" icon={Lock}
            name="password" type={showPw ? 'text' : 'password'} required autoComplete="new-password"
            value={form.password} onChange={change} onBlur={blur} placeholder="Min. 6 characters"
            error={pwError}
            hint={pwHint}
            trailing={<PasswordToggle shown={showPw} onToggle={() => setShowPw(o => !o)} />}
          />

          <Input
            id="register-confirm" label="Confirm password" icon={Lock}
            name="confirm" type="password" required autoComplete="new-password"
            value={form.confirm} onChange={change} onBlur={blur} placeholder="Re-enter password"
            error={confirmError}
          />

          <Button type="submit" size="lg" fullWidth loading={loading} icon={UserPlus}>
            {loading ? 'Creating account…' : 'Create account'}
          </Button>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400 leading-relaxed">
            By creating an account you agree to our{' '}
            <Link to="/terms" className="underline underline-offset-2 hover:text-gray-700 dark:hover:text-gray-200 rounded">Terms</Link> and{' '}
            <Link to="/privacy" className="underline underline-offset-2 hover:text-gray-700 dark:hover:text-gray-200 rounded">Privacy Policy</Link>.
          </p>
        </form>
      </div>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="font-semibold text-brand-600 dark:text-brand-400 hover:underline rounded">Sign in</Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
