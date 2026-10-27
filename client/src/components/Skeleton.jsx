import React from 'react';

// Shared skeleton primitives. A shape of the real content reads as faster than a spinner.

export const Bar = ({ className = '', style }) => (
  <div className={`rounded bg-gray-200 dark:bg-gray-800 ${className}`} style={style} />
);

export const SkeletonBlock = ({ children, label = 'Loading' }) => (
  <div role="status" aria-label={label} className="animate-pulse">
    {children}
    <span className="sr-only">{label}…</span>
  </div>
);

// Stat tiles used on the student and admin dashboards
export const StatCardsSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card p-5">
        <Bar className="h-5 w-5 mb-3" />
        <Bar className="h-6 w-14 mb-2" />
        <Bar className="h-3 w-20 bg-gray-100 dark:bg-gray-800/60" />
      </div>
    ))}
  </div>
);

// Generic list card with a header and rows
export const ListSkeleton = ({ rows = 5, header = true }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">
    {header && (
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <Bar className="h-4 w-36" />
      </div>
    )}
    <div className="divide-y divide-gray-50 dark:divide-gray-800">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Bar className="h-9 w-9 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Bar className="h-3.5" style={{ width: `${70 - i * 7}%` }} />
            <Bar className="h-3 w-24 bg-gray-100 dark:bg-gray-800/60" />
          </div>
          <Bar className="h-3 w-10 bg-gray-100 dark:bg-gray-800/60 shrink-0" />
        </div>
      ))}
    </div>
  </div>
);

// Matches the quiz card grid on the Explore page
export const QuizGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card p-5">
        <div className="flex gap-2 mb-4">
          <Bar className="h-5 w-16 rounded-lg" />
          <Bar className="h-5 w-24 rounded-lg bg-gray-100 dark:bg-gray-800/60" />
        </div>
        <Bar className="h-5 w-3/4 mb-2.5" />
        <Bar className="h-3 w-full mb-1.5 bg-gray-100 dark:bg-gray-800/60" />
        <Bar className="h-3 w-5/6 mb-6 bg-gray-100 dark:bg-gray-800/60" />
        <div className="flex items-center justify-between">
          <Bar className="h-3 w-28 bg-gray-100 dark:bg-gray-800/60" />
          <Bar className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonBlock;
