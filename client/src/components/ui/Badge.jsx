import React from 'react';
import { difficultyOf } from '../../utils/quiz';

const TONES = {
  gray:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300',
  green:  'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  amber:  'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  red:    'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  blue:   'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
};

const DOTS = {
  gray: 'bg-gray-400', brand: 'bg-brand-500', green: 'bg-emerald-500', amber: 'bg-amber-500',
  red: 'bg-red-500', blue: 'bg-sky-500', violet: 'bg-violet-500',
};

const Badge = ({ tone = 'gray', dot = false, icon: Icon, className = '', children }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${TONES[tone] || TONES.gray} ${className}`}>
    {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOTS[tone] || DOTS.gray}`} aria-hidden="true" />}
    {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
    {children}
  </span>
);

export const DifficultyBadge = ({ difficulty, className }) => {
  const d = difficultyOf(difficulty);
  return <Badge tone={d.tone} dot className={className}>{d.label}</Badge>;
};

export default Badge;
