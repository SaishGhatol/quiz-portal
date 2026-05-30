import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Logo from '../Logo';
import {
  Sun, Moon, Menu, X, LogOut, ChevronDown,
  UserCog, Trophy, Settings, BarChart2, Layers, BookOpen
} from 'lucide-react';

const Navbar = () => {
  const { currentUser, logout, isAdmin, isOrgAdmin } = useContext(AuthContext);
  const { isDark, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate   = useNavigate();
  const location   = useLocation();

  const isStudent = currentUser && !isOrgAdmin && !isAdmin;
  const hasOrg    = !!currentUser?.orgId;

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    setProfileOpen(false);
    navigate('/');
  };

  useEffect(() => {
    const h = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { setMobileOpen(false); setProfileOpen(false); }, [location.pathname]);

  const active = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const NavLink = ({ to, children, exact = false }) => {
    const isActive = exact ? location.pathname === to : active(to);
    return (
      <Link to={to}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/60'
        }`}>
        {children}
      </Link>
    );
  };

  const DropItem = ({ to, icon: Icon, children }) => (
    <Link to={to} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <Icon className="h-4 w-4 text-gray-400 shrink-0" />
      {children}
    </Link>
  );

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 h-16 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center gap-4">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <Logo size={28} />
            <span className="font-bold text-gray-900 dark:text-white text-[15px] tracking-tight hidden sm:block">
              Quiz Portal
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            <NavLink to="/quizzes" exact>Explore</NavLink>
            <NavLink to="/leaderboard" exact>Leaderboard</NavLink>

            {currentUser && <NavLink to="/dashboard" exact>Dashboard</NavLink>}

            {/* Students in an org → My Classes */}
            {isStudent && hasOrg && <NavLink to="/my-classes" exact>My Classes</NavLink>}

            {/* Org admin → My Org (hub for all org admin pages) */}
            {isOrgAdmin && <NavLink to="/org">My Org</NavLink>}

            {/* Quiz creation for org_admin and platform admin */}
            {(isOrgAdmin || isAdmin) && <NavLink to="/admin/quizzes">Quizzes</NavLink>}

            {/* Platform admin only */}
            {isAdmin && <NavLink to="/admin/users">Users</NavLink>}

            {!currentUser && <NavLink to="/pricing" exact>Pricing</NavLink>}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Theme toggle */}
            <button onClick={toggle} aria-label="Toggle theme"
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {currentUser ? (
              /* ── Profile dropdown ── */
              <div className="relative hidden md:block" ref={profileRef}>
                <button onClick={() => setProfileOpen(o => !o)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {currentUser.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden lg:block max-w-[110px] truncate">
                    {currentUser.name}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                      <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1 text-xs px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded font-medium capitalize">
                        {currentUser.role?.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Common links */}
                    <DropItem to="/profile"     icon={UserCog}>Profile settings</DropItem>
                    <DropItem to="/my-attempts" icon={Trophy}>My attempts</DropItem>
                    <DropItem to="/progress"    icon={BarChart2}>Progress report</DropItem>

                    {/* Student org links */}
                    {isStudent && hasOrg && (
                      <DropItem to="/my-classes" icon={Layers}>My classes</DropItem>
                    )}

                    {/* Org admin links */}
                    {isOrgAdmin && (
                      <>
                        <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
                          <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Organisation</p>
                          <DropItem to="/org"              icon={Settings}>Dashboard</DropItem>
                          <DropItem to="/org/batches"      icon={Layers}>Batches</DropItem>
                          <DropItem to="/org/students"     icon={UserCog}>Students</DropItem>
                          <DropItem to="/org/assignments"  icon={BookOpen}>Assignments</DropItem>
                        </div>
                      </>
                    )}

                    {/* Platform admin links */}
                    {isAdmin && (
                      <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
                        <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
                        <DropItem to="/admin"         icon={Settings}>Admin dashboard</DropItem>
                        <DropItem to="/admin/quizzes" icon={BookOpen}>Manage quizzes</DropItem>
                        <DropItem to="/admin/users"   icon={UserCog}>Manage users</DropItem>
                      </div>
                    )}

                    {/* Logout */}
                    <div className="border-t border-gray-100 dark:border-gray-800 mt-1">
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <LogOut className="h-4 w-4 shrink-0" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login"
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Login
                </Link>
                <Link to="/register"
                  className="px-3 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors">
                  Register
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(o => !o)}
              className="md:hidden p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile panel ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/20 dark:bg-black/50" onClick={() => setMobileOpen(false)} />
          <nav className="absolute top-16 inset-x-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm px-4 py-3 space-y-0.5 max-h-[80vh] overflow-y-auto">
            <MobileNavLink to="/quizzes"     loc={location}>Explore Quizzes</MobileNavLink>
            <MobileNavLink to="/leaderboard" loc={location}>Leaderboard</MobileNavLink>

            {currentUser && <MobileNavLink to="/dashboard"   loc={location}>Dashboard</MobileNavLink>}
            {currentUser && <MobileNavLink to="/my-attempts" loc={location}>My Attempts</MobileNavLink>}
            {currentUser && <MobileNavLink to="/progress"    loc={location}>Progress</MobileNavLink>}

            {/* Student org */}
            {isStudent && hasOrg && <MobileNavLink to="/my-classes" loc={location}>My Classes</MobileNavLink>}

            {/* Org admin */}
            {isOrgAdmin && (
              <>
                <div className="pt-2 pb-1">
                  <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Organisation</p>
                </div>
                <MobileNavLink to="/org"             loc={location}>Dashboard</MobileNavLink>
                <MobileNavLink to="/org/batches"     loc={location}>Batches</MobileNavLink>
                <MobileNavLink to="/org/students"    loc={location}>Students</MobileNavLink>
                <MobileNavLink to="/org/assignments" loc={location}>Assignments</MobileNavLink>
                <MobileNavLink to="/org/analytics"   loc={location}>Analytics</MobileNavLink>
                <MobileNavLink to="/admin/quizzes"   loc={location}>Quizzes</MobileNavLink>
              </>
            )}

            {/* Platform admin */}
            {isAdmin && (
              <>
                <div className="pt-2 pb-1">
                  <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
                </div>
                <MobileNavLink to="/admin"         loc={location}>Admin Dashboard</MobileNavLink>
                <MobileNavLink to="/admin/quizzes" loc={location}>Manage Quizzes</MobileNavLink>
                <MobileNavLink to="/admin/users"   loc={location}>Manage Users</MobileNavLink>
              </>
            )}

            {!currentUser && <MobileNavLink to="/pricing" loc={location}>Pricing</MobileNavLink>}

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
              {currentUser ? (
                <button onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20">
                  Sign out
                </button>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <Link to="/login"    className="px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-md text-center">Login</Link>
                  <Link to="/register" className="px-3 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md text-center">Register</Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

const MobileNavLink = ({ to, children, loc }) => {
  const isActive = loc.pathname === to || loc.pathname.startsWith(to + '/');
  return (
    <Link to={to}
      className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}>
      {children}
    </Link>
  );
};

export default Navbar;
