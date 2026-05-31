import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../Logo';

const Footer = () => (
  <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center gap-2 mb-3">
            <Logo size={24} />
            <span className="font-bold text-gray-900 dark:text-white text-sm">ExamVault</span>
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
            A quiz platform for students, educators, and training teams.
          </p>
        </div>

        {/* Platform links */}
        <div>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Platform</p>
          <ul className="space-y-2">
            {[['/', 'Home'], ['/quizzes', 'Explore Quizzes'], ['/leaderboard', 'Leaderboard'], ['/dashboard', 'Dashboard']].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal links */}
        <div>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Legal</p>
          <ul className="space-y-2">
            {[['/terms', 'Terms of Service'], ['/privacy', 'Privacy Policy'], ['/contact', 'Contact']].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400 dark:text-gray-500">
        <span>© {new Date().getFullYear()} ExamVault. All rights reserved.</span>
        <span>Built by <span className="text-gray-600 dark:text-gray-300 font-medium">Saish Ghatol</span></span>
      </div>
    </div>
  </footer>
);

export default Footer;
