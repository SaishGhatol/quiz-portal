import React from 'react';

// Shown while a lazily-loaded route chunk is fetched.
// Mirrors the usual page shell so the layout does not jump when content lands.
const RouteFallback = () => (
  <div className="min-h-[60vh] bg-gray-50 dark:bg-gray-950" role="status" aria-label="Loading page">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-7 w-56 rounded bg-gray-200 dark:bg-gray-800" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card p-5">
            <div className="h-5 w-5 rounded bg-gray-200 dark:bg-gray-800 mb-3" />
            <div className="h-6 w-14 rounded bg-gray-200 dark:bg-gray-800 mb-2" />
            <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800/60" />
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-9 w-9 rounded-lg bg-gray-200 dark:bg-gray-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 rounded bg-gray-200 dark:bg-gray-800" style={{ width: `${70 - i * 8}%` }} />
                <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-800/60" />
              </div>
              <div className="h-3 w-10 rounded bg-gray-100 dark:bg-gray-800/60 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
    <span className="sr-only">Loading…</span>
  </div>
);

export default RouteFallback;
