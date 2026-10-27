import React from 'react';

const BAR = {
  brand: 'bg-brand-500',
  green:  'bg-emerald-500',
  amber:  'bg-amber-500',
  red:    'bg-red-500',
};

const RING = {
  brand: 'stroke-brand-500',
  green:  'stroke-emerald-500',
  amber:  'stroke-amber-500',
  red:    'stroke-red-500',
};

const clamp = v => Math.max(0, Math.min(100, v || 0));

export const ProgressBar = ({ value = 0, max = 100, tone = 'brand', size = 'md', label, className = '' }) => {
  const pct = clamp(max > 0 ? (value / max) * 100 : 0);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      className={`w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden ${size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2'} ${className}`}
    >
      <div className={`h-full rounded-full ${BAR[tone] || BAR.brand} transition-[width] duration-500 ease-out`} style={{ width: `${pct}%` }} />
    </div>
  );
};

// Circular progress — the label/number goes in `children`, centred
export const ProgressRing = ({ value = 0, size = 120, stroke = 10, tone = 'brand', label, children }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = clamp(value);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label || `${Math.round(pct)}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-gray-100 dark:stroke-gray-800" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          className={RING[tone] || RING.brand}
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
};

export default ProgressBar;
