import React from 'react';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import Button from './Button';

// Shown when a list or section legitimately has nothing in it
export const EmptyState = ({ icon: Icon, title, description, action, compact = false, className = '' }) => (
  <div className={`flex flex-col items-center text-center px-6 ${compact ? 'py-10' : 'py-16'} ${className}`}>
    {Icon && (
      <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-gray-400 dark:text-gray-500" aria-hidden="true" />
      </div>
    )}
    <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
    {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
  </div>
);

// Shown when a request failed; pass `onRetry` to offer a retry
export const ErrorState = ({ title = 'Something went wrong', message, onRetry, action, className = '' }) => (
  <div role="alert" className={`flex flex-col items-center text-center px-6 py-16 ${className}`}>
    <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
      <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
    </div>
    <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
    {message && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">{message}</p>}
    {(onRetry || action) && (
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {onRetry && <Button variant="secondary" icon={RefreshCw} onClick={onRetry}>Try again</Button>}
        {action}
      </div>
    )}
  </div>
);

export const Spinner = ({ label = 'Loading', className = '' }) => (
  <div role="status" className={`flex flex-col items-center justify-center gap-3 py-16 ${className}`}>
    <Loader2 className="h-6 w-6 animate-spin text-brand-500" aria-hidden="true" />
    <span className="text-sm text-gray-500 dark:text-gray-400">{label}…</span>
  </div>
);
