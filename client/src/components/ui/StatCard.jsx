import React from 'react';

const ICON_TONES = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
  green:  'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  amber:  'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  red:    'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  blue:   'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
};

// Small metric tile: icon, big number, label and an optional hint line
const StatCard = ({ icon: Icon, label, value, hint, tone = 'brand', className = '' }) => (
  <div className={`bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card p-4 sm:p-5 ${className}`}>
    <div className="flex items-center justify-between gap-2 mb-3">
      <p className="text-xs sm:text-[13px] font-medium text-gray-500 dark:text-gray-400">{label}</p>
      {Icon && (
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ICON_TONES[tone] || ICON_TONES.brand}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums font-display">{value}</p>
    {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">{hint}</p>}
  </div>
);

export default StatCard;
