import React from 'react';

/**
 * Segmented control for switching a filter/view.
 * options: [{ value, label, count? }]
 */
const Tabs = ({ options, value, onChange, label = 'Filter', className = '' }) => (
  <div role="tablist" aria-label={label}
    className={`inline-flex max-w-full overflow-x-auto no-scrollbar gap-1 p-1 bg-gray-100 dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 rounded-xl ${className}`}>
    {options.map(o => {
      const active = o.value === value;
      return (
        <button key={o.value} type="button" role="tab" aria-selected={active} onClick={() => onChange(o.value)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
            active
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-card'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}>
          {o.label}
          {typeof o.count === 'number' && (
            <span className={`text-[11px] tabular-nums px-1.5 rounded-full ${
              active ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300' : 'bg-gray-200/70 dark:bg-gray-800 text-gray-500'
            }`}>{o.count}</span>
          )}
        </button>
      );
    })}
  </div>
);

export default Tabs;
