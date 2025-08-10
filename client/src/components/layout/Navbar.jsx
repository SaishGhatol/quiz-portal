import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';

const Navbar = () => {
  const { currentUser, logout, isAdmin } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // First letter of user's name for avatar
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  // Get user avatar
  const getUserAvatar = (user) => {
    if (user?.profilePicture) {
      return user.profilePicture;
    }
    return `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || ''}`;
  };
  
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg fixed top-0 left-0 w-full z-50 bg-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Quiz Portal
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/quizzes" className="px-3 py-2 rounded-md hover:bg-blue-500 hover:bg-opacity-50 transition duration-150">Explore Quizzes</Link>
            
            {currentUser ? (
              <>
                <Link to="/dashboard" className="px-3 py-2 rounded-md hover:bg-blue-500 hover:bg-opacity-50 transition duration-150">Dashboard</Link>
                <Link to="/my-attempts" className="px-3 py-2 rounded-md hover:bg-blue-500 hover:bg-opacity-50 transition duration-150">My Attempts</Link>
                
                {isAdmin && (
                  <Link to="/admin" className="px-3 py-2 rounded-md hover:bg-blue-500 hover:bg-opacity-50 transition duration-150">Admin</Link>
                )}
                
                <div className="relative ml-3">
                  <button
                    onClick={toggleMenu}
                    className="flex items-center focus:outline-none"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-800 font-medium overflow-hidden">
                        <img 
                          src={getUserAvatar(currentUser)}
                          alt={currentUser.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="mr-1 hidden lg:inline">{currentUser.name}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>
                  
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 z-10 border border-gray-200">
                      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-800 font-medium overflow-hidden">
                        <img 
                          src={getUserAvatar(currentUser)}
                          alt={currentUser.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                        <div>
                          <p className="text-sm text-gray-700 font-medium">{currentUser.name}</p>
                          <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                        </div>
                      </div>
                      <Link 
                        to="/profile" 
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </Link>
                      
                      <button 
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }} 
                        className=" w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 rounded-md hover:bg-blue-500 hover:bg-opacity-50 transition duration-150">Login</Link>
                <Link to="/register" className="bg-white text-blue-600 font-medium px-4 py-2 rounded-md hover:bg-blue-50 transition duration-150">Register</Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={toggleMenu} className="focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-blue-500">
            <Link to="/" className="block py-2 px-3 rounded-md hover:bg-blue-500 hover:bg-opacity-50" onClick={toggleMenu}>Home</Link>
            <Link to="/quizzes" className="block py-2 px-3 rounded-md hover:bg-blue-500 hover:bg-opacity-50" onClick={toggleMenu}>Explore Quizzes</Link>
            
            {currentUser ? (
              <>
                <Link to="/dashboard" className="block py-2 px-3 rounded-md hover:bg-blue-500 hover:bg-opacity-50" onClick={toggleMenu}>Dashboard</Link>
                <Link to="/my-attempts" className="block py-2 px-3 rounded-md hover:bg-blue-500 hover:bg-opacity-50" onClick={toggleMenu}>My Attempts</Link>
                
                {isAdmin && (
                  <Link to="/admin" className="block py-2 px-3 rounded-md hover:bg-blue-500 hover:bg-opacity-50" onClick={toggleMenu}>Admin</Link>
                )}
                
                <div className="border-t border-blue-500 my-2 pt-2">
                  <div className="flex items-center px-3 py-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                      <img 
                        src={getUserAvatar(currentUser)}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{currentUser.name}</p>
                      <p className="text-xs text-blue-200">{currentUser.email}</p>
                    </div>
                  </div>
                  
                  <Link to="/profile" className="py-2 px-3 rounded-md hover:bg-blue-500 hover:bg-opacity-50 flex items-center" onClick={toggleMenu}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                  
                  <button 
                    onClick={() => {
                      handleLogout();
                      toggleMenu();
                    }} 
                    className="w-full text-left py-2 px-3 rounded-md hover:bg-blue-500 hover:bg-opacity-50 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 px-3 rounded-md hover:bg-blue-500 hover:bg-opacity-50" onClick={toggleMenu}>Login</Link>
                <Link to="/register" className="block py-2 px-3 rounded-md hover:bg-blue-500 hover:bg-opacity-50" onClick={toggleMenu}>Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;