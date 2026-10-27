import React from 'react';

const COLORS = [
  'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
];

const SIZES = { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' };

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

// Same name → same colour, so people are recognisable across lists
const colorFor = name => {
  let h = 0;
  for (const ch of name || '') h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
};

const Avatar = ({ name, src, size = 'sm', className = '' }) => (src ? (
  <img src={src} alt="" aria-hidden="true"
    className={`inline-block rounded-full object-cover shrink-0 ${SIZES[size] || SIZES.sm} ${className}`} />
) : (
  <span aria-hidden="true"
    className={`inline-flex items-center justify-center rounded-full font-bold shrink-0 ${SIZES[size] || SIZES.sm} ${colorFor(name)} ${className}`}>
    {initials(name)}
  </span>
));

export default Avatar;
