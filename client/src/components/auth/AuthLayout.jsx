import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpenCheck, LineChart, Trophy, Award, Eye, EyeOff } from 'lucide-react';
import Logo from '../Logo';

const HIGHLIGHTS = [
  { icon: BookOpenCheck, title: 'Practice with purpose', text: 'Timed quizzes across subjects, with instant scoring and answer review.' },
  { icon: LineChart,     title: 'See yourself improve',   text: 'Every attempt feeds your progress, streaks and weak-topic breakdown.' },
  { icon: Trophy,        title: 'Compete on leaderboards', text: 'Rank against other learners by score, then by speed.' },
  { icon: Award,         title: 'Earn certificates',      text: 'Pass a quiz and keep a record of what you have mastered.' },
];

// Icon-only toggle that sits inside the password field
export const PasswordToggle = ({ shown, onToggle }) => (
  <button type="button" onClick={onToggle} aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown}
    className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
    {shown ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
  </button>
);

/**
 * Shared shell for Login/Register. A light brand panel on desktop (hidden on
 * mobile, where the form takes the full screen) so the auth flow feels like
 * part of the product rather than a bare form.
 */
const AuthLayout = ({ children }) => (
  <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] bg-gray-50 dark:bg-gray-950">

    {/* Brand panel — desktop only */}
    <aside className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-brand-50 dark:bg-gray-900 border-r border-brand-100 dark:border-gray-800 px-12 xl:px-16 py-14 text-gray-900 dark:text-white">
      {/* Subtle dot grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12] pointer-events-none text-brand-300 dark:text-brand-400"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}
      />
      <div aria-hidden="true" className="absolute -right-32 -bottom-32 w-96 h-96 rounded-full border border-brand-200 dark:border-white/10 pointer-events-none" />
      <div aria-hidden="true" className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full border border-brand-200 dark:border-white/10 pointer-events-none" />

      <Link to="/" className="relative inline-flex items-center gap-2.5 w-fit rounded-lg">
        <Logo size={32} />
        <span className="font-display font-bold text-lg tracking-tight">ExamVault</span>
      </Link>

      <div className="relative max-w-md">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300 mb-3">For learners</p>
        <h2 className="text-3xl xl:text-[34px] font-bold leading-tight">
          Practise smarter.<br />Track every step forward.
        </h2>
        <ul className="mt-9 space-y-5">
          {HIGHLIGHTS.map(h => (
            <li key={h.title} className="flex items-start gap-3.5">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-white dark:bg-white/5 ring-1 ring-brand-200 dark:ring-white/10 shadow-card shrink-0">
                <h.icon className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{h.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-0.5">{h.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-sm text-gray-600 dark:text-gray-400 border-t border-brand-200/70 dark:border-gray-800 pt-6 max-w-md leading-relaxed">
        Studying with an institute? Join your batch with the invite code from your teacher to see assigned tests alongside your own practice.
      </p>
    </aside>

    {/* Form panel */}
    <div className="flex items-center justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-sm animate-fade-up">
        <Link to="/" className="lg:hidden flex items-center justify-center gap-2.5 mb-8 w-fit mx-auto rounded-lg">
          <Logo size={36} />
          <span className="font-display font-bold text-lg text-gray-900 dark:text-white tracking-tight">ExamVault</span>
        </Link>
        {children}
      </div>
    </div>
  </div>
);

export default AuthLayout;
