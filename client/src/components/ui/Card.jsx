import React from 'react';

/**
 * Base surface. `interactive` adds a hover lift for clickable cards;
 * `padding={false}` lets lists and tables run edge to edge.
 */
export const Card = ({ as = 'div', interactive = false, padding = true, className = '', children, ...rest }) => {
  const Tag = as;
  return (
  <Tag
    className={[
      'bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card',
      interactive ? 'hover:border-brand-200 dark:hover:border-brand-500/40 hover:shadow-raised transition-shadow' : '',
      padding ? 'p-5 sm:p-6' : 'overflow-hidden',
      className,
    ].join(' ')}
    {...rest}
  >
    {children}
  </Tag>
  );
};

// Title row for a card, with an optional icon and a right-aligned action (link/button)
export const CardHeader = ({ title, subtitle, icon: Icon, action, className = '' }) => (
  <div className={`flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 ${className}`}>
    <div className="flex items-center gap-2.5 min-w-0">
      {Icon && <Icon className="h-4 w-4 text-brand-500 shrink-0" aria-hidden="true" />}
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold text-gray-900 dark:text-white truncate">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default Card;
