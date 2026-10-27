import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../Logo';

const COLUMNS = [
  { title: 'Learn',   links: [['/quizzes', 'Explore quizzes'], ['/leaderboard', 'Leaderboard'], ['/dashboard', 'Dashboard']] },
  { title: 'Company', links: [['/', 'Home'], ['/pricing', 'Pricing'], ['/contact', 'Contact']] },
  { title: 'Legal',   links: [['/terms', 'Terms of Service'], ['/privacy', 'Privacy Policy']] },
];

const Footer = () => (
  <footer className="bg-white dark:bg-gray-950 border-t border-gray-200/80 dark:border-gray-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10">

        {/* Brand */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 rounded-lg">
            <Logo size={26} />
            <span className="font-display font-bold text-gray-900 dark:text-white">ExamVault</span>
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
            Practise with timed quizzes, track your progress and see how you rank. Built for learners, and for the institutes that teach them.
          </p>
        </div>

        {COLUMNS.map(col => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3.5">{col.title}</p>
            <ul className="space-y-2.5">
              {col.links.map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mt-12 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>© {new Date().getFullYear()} ExamVault. All rights reserved.</span>
        <span>Built by <span className="text-gray-700 dark:text-gray-300 font-medium">Saish Ghatol</span></span>
      </div>
    </div>
  </footer>
);

export default Footer;
