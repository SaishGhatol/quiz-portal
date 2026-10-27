import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BRAND = 'ExamVault';

// Longest matching prefix wins, so /admin/quizzes beats /admin
const TITLES = [
  ['/quizzes',           'Explore Quizzes'],
  ['/leaderboard',       'Leaderboard'],
  ['/pricing',           'Pricing'],
  ['/login',             'Sign in'],
  ['/register',          'Create account'],
  ['/terms',             'Terms of Service'],
  ['/privacy',           'Privacy Policy'],
  ['/contact',           'Contact us'],
  ['/dashboard',         'Dashboard'],
  ['/profile',           'Profile settings'],
  ['/my-attempts',       'My attempts'],
  ['/progress',          'Progress report'],
  ['/attempts',          'Attempt details'],
  ['/quiz/results',      'Quiz results'],
  ['/quiz',              'Quiz'],
  ['/my-assignments',    'My assignments'],
  ['/my-classes',        'My classes'],
  ['/practice',          'Practice'],
  ['/mistakes',          'Mistake notebook'],
  ['/org/join',          'Join organisation'],
  ['/org/setup',         'Organisation setup'],
  ['/org/batches',       'Batches'],
  ['/org/students',      'Students'],
  ['/org/assignments',   'Assignments'],
  ['/org/analytics',     'Organisation analytics'],
  ['/org/announcements', 'Announcements'],
  ['/org',               'Organisation'],
  ['/admin/quizzes',     'Manage quizzes'],
  ['/admin/users',       'Manage users'],
  ['/admin/reviews',     'Manage reviews'],
  ['/admin/analytics',   'Analytics'],
  ['/admin/reports',     'Reports'],
  ['/admin',             'Admin dashboard'],
];

const titleFor = pathname => {
  if (pathname === '/') return `${BRAND} — Test your knowledge`;
  const match = TITLES
    .filter(([prefix]) => pathname === prefix || pathname.startsWith(prefix + '/'))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return match ? `${match[1]} · ${BRAND}` : BRAND;
};

// Keeps the tab title and scroll position sane on every navigation
export default function useRouteChrome() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = titleFor(pathname);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
