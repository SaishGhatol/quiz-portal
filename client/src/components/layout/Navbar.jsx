import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Logo from '../Logo';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { roleHome } from '../../utils/roles';
import {
  Sun, Moon, Menu, X, LogOut, ChevronDown, Compass, LayoutDashboard, Building2, Megaphone, MessageSquareQuote, FileDown, NotebookPen, Bookmark,
  UserCog, Trophy, BarChart2, Layers, BookOpen, CreditCard, History, Users, Tag, ClipboardList
} from 'lucide-react';

const isActivePath = (pathname, to, exact) =>
  exact ? pathname === to : pathname === to || pathname.startsWith(to + '/');

const Navbar = () => {
  const { currentUser, logout, isAdmin, isOrgAdmin } = useContext(AuthContext);
  const { isDark, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate   = useNavigate();
  const { pathname } = useLocation();

  const isStudent = currentUser && !isOrgAdmin && !isAdmin;
  const hasOrg    = !!currentUser?.orgId;

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    setProfileOpen(false);
    navigate('/');
  };

  // Close the profile menu on outside click or Escape
  useEffect(() => {
    const onDown = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    const onKey = e => { if (e.key === 'Escape') { setProfileOpen(false); setMobileOpen(false); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => { setMobileOpen(false); setProfileOpen(false); }, [pathname]);

  // Each role gets its own top-level tools; the same lists drive the desktop bar and the mobile panel
  const role = currentUser?.role;
  const primary = (
    role === 'admin' ? [
      { to: '/admin',           label: 'Overview',  icon: LayoutDashboard, exact: true },
      { to: '/admin/quizzes',   label: 'Quizzes',   icon: BookOpen },
      { to: '/admin/users',     label: 'Users',     icon: Users },
      { to: '/admin/reviews',   label: 'Reviews',   icon: MessageSquareQuote },
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
    ] : role === 'org_admin' ? [
      { to: '/org',             label: 'Overview',    icon: LayoutDashboard, exact: true },
      { to: '/admin/quizzes',   label: 'Quizzes',     icon: BookOpen },
      { to: '/org/batches',     label: 'Batches',     icon: Layers },
      { to: '/org/students',    label: 'Students',    icon: Users },
      { to: '/org/assignments', label: 'Assignments', icon: ClipboardList },
    ] : currentUser ? [
      { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard, exact: true },
      { to: '/quizzes',     label: 'Explore',     icon: Compass, exact: true },
      hasOrg && { to: '/my-classes', label: 'My Classes', icon: Building2, exact: true },
      { to: '/leaderboard', label: 'Leaderboard', icon: Trophy, exact: true },
    ] : [
      { to: '/quizzes',     label: 'Explore',     icon: Compass, exact: true },
      { to: '/leaderboard', label: 'Leaderboard', icon: Trophy, exact: true },
      { to: '/pricing',     label: 'Pricing',     icon: Tag, exact: true },
    ]
  ).filter(Boolean);

  // Account menu: learners get their history; admins get the rest of their workspace
  const personal = [
    isStudent && { to: '/my-attempts', label: 'My attempts',     icon: History },
    isStudent && { to: '/progress',    label: 'Progress report', icon: BarChart2 },
    isStudent && { to: '/mistakes',    label: 'Mistake notebook', icon: NotebookPen },
    isStudent && { to: '/quizzes?view=saved', label: 'Saved quizzes', icon: Bookmark },
    isStudent && hasOrg && { to: '/my-assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/profile', label: 'Profile settings', icon: UserCog },
  ].filter(Boolean);

  const orgLinks = role === 'org_admin' ? [
    { to: '/org/analytics',     label: 'Analytics',     icon: BarChart2 },
    { to: '/org/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/org/billing',       label: 'Plan & billing', icon: CreditCard },
    { to: '/quizzes',           label: 'Preview as student', icon: Compass },
  ] : [];

  const adminLinks = role === 'admin' ? [
    { to: '/admin/reports', label: 'Reports & exports', icon: FileDown },
    { to: '/quizzes',       label: 'Preview as student', icon: Compass },
  ] : [];

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 h-16 bg-white/85 dark:bg-gray-950/85 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center gap-6">

          {/* Brand */}
          <Link to={currentUser ? roleHome(currentUser) : '/'} className="flex items-center gap-2.5 shrink-0" aria-label="ExamVault home">
            <Logo size={30} />
            <span className="font-display font-bold text-gray-900 dark:text-white text-[17px] hidden sm:block">
              ExamVault
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 min-w-0" aria-label="Main">
            {primary.map(l => {
              const active = isActivePath(pathname, l.to, l.exact);
              return (
                <Link key={l.to} to={l.to} aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    active
                      ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/70'
                  }`}>
                  <l.icon className="h-4 w-4 hidden lg:block" aria-hidden="true" />
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button onClick={toggle} type="button"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="h-10 w-10 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
              {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            {currentUser ? (
              <div className="relative hidden md:block" ref={profileRef}>
                <button type="button" onClick={() => setProfileOpen(o => !o)}
                  aria-haspopup="menu" aria-expanded={profileOpen} aria-label="Account menu"
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <Avatar name={currentUser.name} src={currentUser.profilePicture} size="sm" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden lg:block max-w-[120px] truncate">
                    {currentUser.name?.split(' ')[0]}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                {profileOpen && (
                  <div role="menu"
                    className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-pop overflow-hidden z-50 animate-scale-in origin-top-right">
                    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
                      <Avatar name={currentUser.name} src={currentUser.profilePicture} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
                      </div>
                    </div>

                    <MenuGroup links={personal} />
                    {orgLinks.length > 0 && <MenuGroup title="Organisation" links={orgLinks} />}
                    {adminLinks.length > 0 && <MenuGroup title="Admin" links={adminLinks} />}

                    <div className="border-t border-gray-100 dark:border-gray-800 p-1.5">
                      <button type="button" role="menuitem" onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">
                        <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1.5">
                <Button to="/login" variant="ghost">Sign in</Button>
                <Button to="/register">Get started</Button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button type="button" onClick={() => setMobileOpen(o => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="md:hidden h-10 w-10 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile panel ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-gray-950/30 dark:bg-black/60 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <nav aria-label="Mobile"
            className="absolute top-16 inset-x-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-pop px-4 pt-3 pb-5 max-h-[calc(100vh-4rem)] overflow-y-auto animate-fade-up">

            {currentUser && (
              <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-gray-50 dark:bg-gray-900">
                <Avatar name={currentUser.name} src={currentUser.profilePicture} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
                </div>
              </div>
            )}

            <MobileGroup links={primary} pathname={pathname} />
            {currentUser && <MobileGroup title="You" links={personal} pathname={pathname} />}
            {orgLinks.length > 0 && <MobileGroup title="Organisation" links={orgLinks} pathname={pathname} />}
            {adminLinks.length > 0 && <MobileGroup title="Admin" links={adminLinks} pathname={pathname} />}

            <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
              {currentUser ? (
                <button type="button" onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button to="/login" variant="secondary">Sign in</Button>
                  <Button to="/register">Get started</Button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

const MenuGroup = ({ title, links }) => (
  <div className="p-1.5 border-t first:border-t-0 border-gray-100 dark:border-gray-800">
    {title && <p className="px-3 pt-1.5 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{title}</p>}
    {links.map(l => (
      <Link key={l.to} to={l.to} role="menuitem"
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
        <l.icon className="h-4 w-4 text-gray-400 shrink-0" aria-hidden="true" />
        {l.label}
      </Link>
    ))}
  </div>
);

const MobileGroup = ({ title, links, pathname }) => (
  <div className="py-1">
    {title && <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{title}</p>}
    {links.map(l => {
      const active = isActivePath(pathname, l.to, l.exact);
      return (
        <Link key={l.to} to={l.to} aria-current={active ? 'page' : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
            active
              ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900'
          }`}>
          <l.icon className={`h-4 w-4 ${active ? '' : 'text-gray-400'}`} aria-hidden="true" />
          {l.label}
        </Link>
      );
    })}
  </div>
);

export default Navbar;
