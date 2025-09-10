import React, { useState } from 'react';

// A modern, minimalist SVG icon for the decorative panel (re-used for consistency)
const AuthGraphic = () => (
  <svg width="100%" height="100%" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="max-w-xs text-white">
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M 50,50 Q 100,20 150,50 T 250,50" strokeDasharray="5,5" />
      <path d="M 50,80 Q 100,110 150,80 T 250,80" />
      <path d="M 50,110 Q 100,80 150,110 T 250,110" strokeDasharray="5,5" />
      <path d="M 50,140 Q 100,170 150,140 T 250,140" />
       <circle cx="75" cy="95" r="10" fill="currentColor" />
       <circle cx="125" cy="95" r="10" fill="none" stroke="currentColor" />
    </g>
    <text x="50%" y="90%" textAnchor="middle" fill="currentColor" fontSize="12" fontFamily="Inter, sans-serif" className="opacity-75">
      Your Brand
    </text>
  </svg>
);


const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock functionality as context and router aren't available in this single file component.
  const navigate = (path) => {
    console.log(`Navigating to: ${path}`);
  };

  const register = (name, email, password) => {
    return new Promise((resolve, reject) => {
        console.log("Attempting registration for:", name, email);
        // Simulate API call
        setTimeout(() => {
            if (name && email.includes('@') && password.length > 6) {
                console.log("Registration successful");
                resolve({ user: { name, email } });
            } else {
                console.error("Registration failed");
                reject({ response: { data: { message: "Invalid registration details." } } });
            }
        }, 1500);
    });
  };

  // Mock toast notifications
  const toast = {
    success: (message) => console.log(`SUCCESS: ${message}`),
    error: (message) => console.error(`ERROR: ${message}`),
    info: (message) => console.info(`INFO: ${message}`),
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match. Please try again.');
      return;
    }
     if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(name, email, password);
      toast.success('Registration successful! Redirecting...');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100 font-sans p-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Decorative Panel */}
        <div className="w-full md:w-1/2 bg-black text-white p-12 flex-col justify-center items-center hidden md:flex">
           <div className="max-w-xs">
              <AuthGraphic />
           </div>
           <h2 className="text-3xl font-bold mt-8 text-center">Join Our Community</h2>
           <p className="text-gray-400 mt-2 text-center text-sm">
             Start your journey with us today. It's fast and easy.
           </p>
        </div>

        {/* Form Panel */}
        <div className="w-full md:w-1/2 p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create an Account</h1>
          <p className="text-gray-600 mb-8">Let's get you started!</p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Full Name Input */}
            <div className="relative">
              <input
                id="name"
                type="text"
                className="peer w-full px-4 py-3 border-b-2 border-gray-300 placeholder-transparent focus:outline-none focus:border-black transition-colors"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <label 
                htmlFor="name" 
                className="absolute left-4 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
              >
                Full Name
              </label>
            </div>

            {/* Email Input */}
            <div className="relative">
              <input
                id="email"
                type="email"
                className="peer w-full px-4 py-3 border-b-2 border-gray-300 placeholder-transparent focus:outline-none focus:border-black transition-colors"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label 
                htmlFor="email" 
                className="absolute left-4 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
              >
                Email Address
              </label>
            </div>
            
            {/* Password Input */}
            <div className="relative">
              <input
                id="password"
                type="password"
                className="peer w-full px-4 py-3 border-b-2 border-gray-300 placeholder-transparent focus:outline-none focus:border-black transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <label 
                htmlFor="password" 
                className="absolute left-4 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
              >
                Password
              </label>
            </div>

             {/* Confirm Password Input */}
            <div className="relative">
              <input
                id="confirmPassword"
                type="password"
                className="peer w-full px-4 py-3 border-b-2 border-gray-300 placeholder-transparent focus:outline-none focus:border-black transition-colors"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
              <label 
                htmlFor="confirmPassword" 
                className="absolute left-4 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
              >
                Confirm Password
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                className="group w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : 'Sign Up'}
              </button>
            </div>
          </form>        
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="#login" onClick={(e) => { e.preventDefault(); navigate('/login'); }} className="font-medium text-black hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
