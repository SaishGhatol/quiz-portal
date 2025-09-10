import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import { User, LogOut, ChevronDown, UserCog, Menu, X, ClipboardCheck, Trophy, FileText } from 'lucide-react';

const Navbar = () => {
  const { currentUser, logout, isAdmin } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    closeAllMenus();
    navigate('/');
  };

  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Custom NavLink component to handle active state
  const NavLink = ({ to, children, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    const activeClass = 'bg-gray-800 text-white';
    const inactiveClass = 'text-gray-400 hover:bg-gray-900 hover:text-white';
    return (
      <Link to={to} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? activeClass : inactiveClass}`} onClick={onClick}>
        {children}
      </Link>
    );
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-sm border-b border-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="text-xl font-bold flex items-center text-white gap-2" onClick={closeAllMenus}>
              <ClipboardCheck className="h-7 w-7" />
              Quiz Portal
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <NavLink to="/quizzes">Explore Quizzes</NavLink>
              {currentUser && <NavLink to="/dashboard">Dashboard</NavLink>}
              {currentUser && isAdmin && <NavLink to="/admin">Admin</NavLink>}
              
              {currentUser ? (
                <div className="relative" ref={profileMenuRef}>
                  <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-900 transition-colors">
                    <img 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name || 'U'}&backgroundColor=000000&textColor=ffffff`}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full border-2 border-gray-700 bg-gray-800"
                    />
                    <span className="text-white hidden lg:inline">{currentUser.name}</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-black border border-gray-800 rounded-lg shadow-xl py-1 z-10 animate-fade-in-down">
                      <div className="px-4 py-3 border-b border-gray-800">
                        <p className="text-sm text-white font-medium">{currentUser.name}</p>
                        <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                      </div>
                      <Link to="/profile" className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-900 hover:text-white flex items-center gap-2" onClick={closeAllMenus}><UserCog className="h-4 w-4 text-gray-500" /> Profile</Link>
                      <Link to="/my-attempts" className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-900 hover:text-white flex items-center gap-2" onClick={closeAllMenus}><Trophy className="h-4 w-4 text-gray-500" /> My Attempts</Link>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-900 hover:text-white flex items-center gap-2"><LogOut className="h-4 w-4 text-gray-500" /> Logout</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-x-2">
                  <NavLink to="/login">Login</NavLink>
                  <Link to="/register" className="bg-white text-black font-semibold px-4 py-2 rounded-md text-sm hover:bg-gray-200 transition-colors">Register</Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-400 hover:text-white">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md md:hidden animate-fade-in">
          <div className="container mx-auto px-4 h-full">
            <div className="flex justify-between items-center h-16">
               <Link to="/" className="text-xl font-bold flex items-center text-white gap-2" onClick={closeAllMenus}>
                <ClipboardCheck className="h-7 w-7" />
                Quiz Portal
              </Link>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex flex-col text-center text-xl space-y-4 mt-16">
              <NavLink to="/quizzes" onClick={closeAllMenus}>Explore Quizzes</NavLink>
              {currentUser ? (
                <>
                  <NavLink to="/dashboard" onClick={closeAllMenus}>Dashboard</NavLink>
                  <NavLink to="/profile" onClick={closeAllMenus}>Profile</NavLink>
                  <NavLink to="/my-attempts" onClick={closeAllMenus}>My Attempts</NavLink>
                  {isAdmin && <NavLink to="/admin" onClick={closeAllMenus}>Admin</NavLink>}
                  <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors">Logout</button>
                </>
              ) : (
                <>
                  <NavLink to="/login" onClick={closeAllMenus}>Login</NavLink>
                  <Link to="/register" className="bg-white text-black font-semibold py-3 rounded-md hover:bg-gray-200 transition-colors" onClick={closeAllMenus}>Register</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* CSS for animations */}
      <style>{`
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-down { animation: fadeInDown 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </>
  );
};

export default Navbar;

