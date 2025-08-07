import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../../contexts/AuthContext';
import { ThemeContext } from '../layout/theme';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const { isDay } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const demoCredentials = {
    user: {
      email: 'anuj@dev.com',
      password: '123123123'
    },
    admin: {
      email: 'saish@dev.com',
      password: '123123123'
    }
  };

  const handleDemoLogin = (type) => {
    const credentials = demoCredentials[type];
    setEmail(credentials.email);
    setPassword(credentials.password);
    toast.info(`Demo ${type} credentials loaded`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(email, password);
      toast.success('Login successful');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-full min-h-screen flex items-center justify-center transition-colors duration-500"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div
        className="max-w-md w-full rounded-xl shadow-xl overflow-hidden transition-colors duration-500"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
      >
        <div
          className="py-6 text-center"
          style={{
            background: 'linear-gradient(to right, var(--cta-gradient-from), var(--cta-gradient-to))',
            color: 'var(--button-text)'
          }}
        >
          <h2 className="text-3xl font-extrabold">Welcome Back</h2>
          <p className="mt-2 text-sm opacity-90">Sign in to your account</p>
        </div>

        <div className="p-8">
          {/* Demo Credentials Section */}
          <div
            className="mb-6 p-4 rounded-lg border"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <h3 className="text-sm font-medium mb-3">Demo Credentials</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('user')}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-md border transition duration-150"
                style={{
                  backgroundColor: 'var(--button-bg-light)',
                  color: 'var(--accent-color)',
                  borderColor: 'var(--border-color)'
                }}
              >
                Demo User
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-md border transition duration-150"
                style={{
                  backgroundColor: 'var(--button-bg-light)',
                  color: 'var(--accent-color)',
                  borderColor: 'var(--border-color)'
                }}
              >
                Demo Admin
              </button>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition duration-150"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-color)'
                }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition duration-150"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-color)'
                }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 font-medium rounded-lg transition duration-200 flex justify-center items-center"
              style={{
                background: 'linear-gradient(to right, var(--cta-gradient-from), var(--cta-gradient-to))',
                color: 'var(--button-text)'
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>

        <div
          className="px-2 py-6 border-t text-center text-sm"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)'
          }}
        >
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium transition-colors"
            style={{ color: 'var(--accent-color)' }}
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
