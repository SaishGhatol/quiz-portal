import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import { Compass, ArrowLeft, Home, BookOpen, LayoutDashboard, LogIn, ChevronRight } from 'lucide-react';
import { Button } from './ui';

// Shown for any unknown URL, instead of silently bouncing the user to the home page
const NotFound = () => {
  const { currentUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { to: '/', label: 'Home', desc: 'Back to the start', icon: Home },
    { to: '/quizzes', label: 'Explore quizzes', desc: 'Browse everything available', icon: BookOpen },
    currentUser
      ? { to: '/dashboard', label: 'My dashboard', desc: 'Your scores and assignments', icon: LayoutDashboard }
      : { to: '/login', label: 'Sign in', desc: 'Get back to your account', icon: LogIn },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center animate-fade-up">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/10 ring-1 ring-brand-100 dark:ring-brand-500/20 flex items-center justify-center mx-auto mb-5">
          <Compass className="h-7 w-7 text-brand-600 dark:text-brand-400" aria-hidden="true" />
        </div>

        <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-2">Error 404</p>
        <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 dark:text-white mb-2">This page doesn't exist</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">We couldn't find anything at</p>
        <code className="inline-block max-w-full text-xs font-mono bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-lg mb-8 break-all">
          {location.pathname}
        </code>

        <nav aria-label="Suggested pages" className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card divide-y divide-gray-100 dark:divide-gray-800 text-left overflow-hidden">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className="group flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 focus-visible:outline-offset-[-2px]">
              <span className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                <l.icon className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-brand-600 dark:group-hover:text-brand-400" aria-hidden="true" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-gray-900 dark:text-white">{l.label}</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{l.desc}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 shrink-0" aria-hidden="true" />
            </Link>
          ))}
        </nav>

        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)} className="mt-6">
          Go back
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
