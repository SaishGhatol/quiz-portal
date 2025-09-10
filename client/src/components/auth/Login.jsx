import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../../contexts/AuthContext';
import { LogIn, Github } from 'lucide-react';

// A reusable SVG component for the Google icon
const GoogleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px" {...props}>
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.582-3.444-11.227-8.169l-6.571,4.819C9.656,39.663,16.318,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.191,4.218-4.099,5.591l6.19,5.238C39.712,35.419,44,29.566,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </svg>
);


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful!', { theme: 'dark' });
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed.', { theme: 'dark' });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-black text-gray-300 p-4 overflow-hidden">
      {/* --- ENHANCEMENT: Animated Aurora Background --- */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 left-0 h-96 w-96 bg-[radial-gradient(circle_at_center,_rgba(148,163,184,0.8)_0,_transparent_50%)] animate-[spin_20s_linear_infinite]"></div>
        <div className="absolute bottom-0 right-0 h-96 w-96 bg-[radial-gradient(circle_at_center,_rgba(148,163,184,0.8)_0,_transparent_50%)] animate-[spin_20s_linear_infinite_reverse]"></div>
      </div>

      <div className="relative max-w-sm w-full z-10">
        <div className="bg-black/80 backdrop-blur-lg border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-white">Sign In</h2>
              <p className="mt-2 text-sm text-gray-400">Welcome back to the arena.</p>
            </div>
            
            {/* Social Logins */}
            <div className="space-y-3 mb-6">
              <button className="w-full flex items-center justify-center gap-3 py-3 px-4 text-sm font-medium bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">
                <GoogleIcon />
                Continue with Google
              </button>
              <button className="w-full flex items-center justify-center gap-3 py-3 px-4 text-sm font-medium bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">
                <Github className="h-5 w-5" />
                Continue with GitHub
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center my-6">
              <hr className="flex-grow border-gray-700" />
              <span className="mx-4 text-xs text-gray-500">OR</span>
              <hr className="flex-grow border-gray-700" />
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* --- ENHANCEMENT: Floating Label Input --- */}
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent focus:outline-none focus:ring-1 focus:ring-gray-500 transition"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.g.target.value)}
                  required
                />
                <label
                  htmlFor="email"
                  className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-black/80 px-1 transition-all 
                             peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 
                             peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-400"
                >
                  Email address
                </label>
              </div>
              
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent focus:outline-none focus:ring-1 focus:ring-gray-500 transition"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <label
                  htmlFor="password"
                  className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-black/80 px-1 transition-all 
                             peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 
                             peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-400"
                >
                  Password
                </label>
              </div>
              
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-lg text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white transition disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>

          <div className="px-8 py-4 bg-black/50 border-t border-gray-800">
            <p className="text-center text-sm text-gray-500">
              New to the arena?{' '}
              <Link to="/register" className="font-medium text-white hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;