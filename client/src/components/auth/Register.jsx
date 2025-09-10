import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../../contexts/AuthContext';
import { Github, Eye, EyeOff, User, Shield } from 'lucide-react';
// --- 1. (REMOVED) No longer need useGoogleLogin ---

// GoogleIcon component remains the same.
const GoogleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px" {...props}>
    {/* SVG paths */}
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.582-3.444-11.227-8.169l-6.571,4.819C9.656,39.663,16.318,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.191,4.218-4.099,5.591l6.19,5.238C39.712,35.419,44,29.566,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </svg>
);


const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student'); 
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // --- 1. GET THE NEW FIREBASE-SPECIFIC FUNCTIONS FROM YOUR AUTH CONTEXT ---
  // These functions will now wrap Firebase methods like `createUserWithEmailAndPassword` and `signInWithPopup`.
  const {register, signInWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- 2. RE-IMPLEMENT THE GOOGLE LOGIN HANDLER USING FIREBASE ---
  // This is now a simple async function instead of a hook.
  const handleGoogleRegister = async () => {
    setIsLoading(true);
    try {
      // The logic for signInWithPopup is now inside your AuthContext's signInWithGoogle function
      await signInWithGoogle();
      toast.success('Successfully signed up with Google!', { theme: 'dark' });
      navigate('/dashboard');
    } catch (error) {
      // Handle Firebase specific errors, e.g., popup closed by user
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error(error.message || 'Google sign-up failed', { theme: 'dark' });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- 3. UPDATE THE EMAIL/PASSWORD HANDLER TO USE THE NEW CONTEXT FUNCTION ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match', { theme: 'dark' });
      return;
    }
    setIsLoading(true);
    try {
      // The `registerWithEmail` function in your context will handle creating the user in Firebase
      // and potentially creating a user document in Firestore/MongoDB with the name and role.
      await register(name, email, password, role);
      toast.success('Registration successful!', { theme: 'dark' });
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Registration failed', { theme: 'dark' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCut = (e) => e.preventDefault();
  const handlePaste = (e) => e.preventDefault();
  
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-black text-gray-300 p-4 overflow-hidden">
      {/* Background animations */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 right-0 h-96 w-96 bg-[radial-gradient(circle_at_center,_rgba(148,163,184,0.8)_0,_transparent_50%)] animate-[spin_20s_linear_infinite_reverse]"></div>
        <div className="absolute bottom-0 left-0 h-96 w-96 bg-[radial-gradient(circle_at_center,_rgba(148,163,184,0.8)_0,_transparent_50%)] animate-[spin_20s_linear_infinite]"></div>
      </div>

      <div className="relative max-w-sm w-full z-10">
        <div className="bg-black/80 backdrop-blur-lg border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-white">Create Account</h2>
              <p className="mt-2 text-sm text-gray-400">Join the arena today.</p>
            </div>

            <div className="space-y-3 mb-6">
              {/* --- 4. ATTACH THE NEW HANDLER TO THE GOOGLE BUTTON'S ONCLICK EVENT --- */}
              <button
                onClick={handleGoogleRegister}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 text-sm font-medium bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
                disabled={isLoading}
              >
                <GoogleIcon />
                Sign up with Google
              </button>
              <button className="w-full flex items-center justify-center gap-3 py-3 px-4 text-sm font-medium bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">
                <Github className="h-5 w-5" />
                Sign up with GitHub
              </button>
            </div>

            <div className="flex items-center my-6">
              <hr className="flex-grow border-gray-700" />
              <span className="mx-4 text-xs text-gray-500">OR</span>
              <hr className="flex-grow border-gray-700" />
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-900 border border-gray-700 rounded-lg">
                  <button
                    type="button"
                    className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${role === 'student' ? 'bg-white text-black' : 'text-gray-400 hover:bg-gray-800'}`}
                    onClick={() => setRole('student')}
                  >
                    <User size={16} /> Student
                  </button>
                  <button
                    type="button"
                    className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${role === 'admin' ? 'bg-white text-black' : 'text-gray-400 hover:bg-gray-800'}`}
                    onClick={() => setRole('admin')}
                  >
                    <Shield size={16} /> Admin
                  </button>
                </div>
              </div>

              {/* Input for Full Name */}
              <div className="relative">
                <input id="name" type="text" className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent focus:outline-none focus:ring-1 focus:ring-gray-500" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
                <label htmlFor="name" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-black/80 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-400">
                  Full Name
                </label>
              </div>
              
              {/* Input for Email */}
              <div className="relative">
                <input id="email" type="email" className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent focus:outline-none focus:ring-1 focus:ring-gray-500" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <label htmlFor="email" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-black/80 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-400">
                  Email address
                </label>
              </div>
              
              {/* Input for Password */}
              <div className="relative">
                <input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'}
                  className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent focus:outline-none focus:ring-1 focus:ring-gray-500 pr-10" 
                  placeholder="Password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  minLength={6} 
                  required 
                  onCopy={handleCopyCut}
                  onCut={handleCopyCut}
                />
                <label htmlFor="password" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-black/80 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-400">
                  Password
                </label>
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Input for Confirm Password */}
              <div className="relative">
                <input 
                  id="confirmPassword" 
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent focus:outline-none focus:ring-1 focus:ring-gray-500 pr-10" 
                  placeholder="Confirm Password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  minLength={6} 
                  required 
                  onPaste={handlePaste}
                />
                <label htmlFor="confirmPassword" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-black/80 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-400">
                  Confirm Password
                </label>
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white focus:outline-none"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-lg text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white transition disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </div>
            </form>
          </div>
          
          <div className="px-8 py-4 bg-black/50 border-t border-gray-800">
            <p className="text-center text-sm text-gray-500">
              Already in the arena?{' '}
              <Link to="/login" className="font-medium text-white hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;