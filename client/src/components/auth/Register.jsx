import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../../contexts/AuthContext';
import Logo from '../Logo';
import { Eye, EyeOff, Loader } from 'lucide-react';

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate     = useNavigate();

  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);

  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm)   { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6)         { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const pwMatch = !form.confirm || form.confirm === form.password;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <Logo size={40} className="mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Create account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Free forever — no credit card needed</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {[
              { label: 'Full name',  name: 'name',    type: 'text',     auto: 'name',     placeholder: 'Your name' },
              { label: 'Email',      name: 'email',   type: 'email',    auto: 'email',    placeholder: 'you@example.com' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                <input name={f.name} type={f.type} required autoComplete={f.auto}
                  value={form[f.name]} onChange={change} placeholder={f.placeholder}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <div className="relative">
                <input name="password" type={showPw ? 'text' : 'password'} required
                  value={form.password} onChange={change} placeholder="Min. 6 characters"
                  className="w-full px-3 py-2 pr-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                <button type="button" onClick={() => setShowPw(o => !o)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm password</label>
              <input name="confirm" type="password" required
                value={form.confirm} onChange={change} placeholder="Re-enter password"
                className={`w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  ${!pwMatch ? 'border-red-400 dark:border-red-600' : 'border-gray-300 dark:border-gray-700'}`} />
              {!pwMatch && <p className="text-xs text-red-500 mt-1">Passwords don't match</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">
              {loading ? <><Loader className="h-4 w-4 animate-spin" /> Creating account…</> : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
