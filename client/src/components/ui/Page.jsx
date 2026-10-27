import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const WIDTHS = { sm: 'max-w-2xl', md: 'max-w-4xl', lg: 'max-w-6xl', xl: 'max-w-7xl' };

// Standard page shell: tinted background, centred column, consistent gutters
export const Page = ({ width = 'lg', className = '', children }) => (
  <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950">
    <div className={`${WIDTHS[width] || WIDTHS.lg} mx-auto px-4 sm:px-6 py-8 sm:py-10 ${className}`}>
      {children}
    </div>
  </div>
);

// Page title block with optional back link, eyebrow and right-hand actions
export const PageHeader = ({ eyebrow, title, description, actions, back, className = '' }) => (
  <div className={`mb-8 ${className}`}>
    {back && (
      <Link to={back.to}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {back.label}
      </Link>
    )}
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-1.5">{eyebrow}</p>}
        <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 dark:text-white leading-tight">{title}</h1>
        {description && <p className="text-sm sm:text-[15px] text-gray-500 dark:text-gray-400 mt-1.5 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  </div>
);

export default Page;
