import React, { useId } from 'react';

// Shared geometry (32×32 grid) — also used by public/favicon.svg, keep them in sync
const TICK   = 'M10.6 16.4 L14.5 20.2 L24.6 9.4';
const SCALE  = 'M6.47 21.5L5.26 22.2M5.14 17.72L3.75 17.94M5.24 13.71L3.87 13.42M6.77 10.01L5.6 9.25M9.53 7.1L8.71 5.97M13.15 5.37L12.79 4.02';
const INDEX  = 'M14.6 3.7H17.4L16 5.9Z';
const MINT   = '#8ff0e3';

/**
 * ExamVault mark — a combination-lock dial (the vault) with a number scale and an
 * index marker, unlocked by a tick that breaks out of the ring (a passed exam).
 * The scale doubles as a stopwatch, a nod to timed tests. Two-tone: mint dial,
 * white tick, deep-teal tile. Built to stay legible from 16px up.
 * Usage: <Logo size={32} /> or <Logo className="h-8 w-8" />
 */
const Logo = ({ size = 32, className = '', title = 'ExamVault' }) => {
  // Unique ids so several logos on one page don't share gradients/masks
  // (React's ids contain characters like «» that some browsers won't resolve inside url(#…))
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const tile = `ev-tile-${uid}`;
  const shine = `ev-shine-${uid}`;
  const cut = `ev-cut-${uid}`;

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"
      className={className} role="img" aria-label={`${title} logo`}>
      <defs>
        <linearGradient id={tile} x1="3" y1="1" x2="29" y2="31" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#16a89d" />
          <stop offset="1" stopColor="#075c58" />
        </linearGradient>
        <radialGradient id={shine} cx="9" cy="6" r="18" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        {/* Clears the dial where the tick passes, so the tick reads as breaking out of the ring */}
        <mask id={cut} maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
          <rect width="32" height="32" fill="#fff" />
          <path d={TICK} stroke="#000" strokeWidth="6.8" strokeLinecap="round" strokeLinejoin="round" />
        </mask>
      </defs>

      <rect width="32" height="32" rx="9" fill={`url(#${tile})`} />
      <rect width="32" height="32" rx="9" fill={`url(#${shine})`} />

      <g mask={`url(#${cut})`}>
        <circle cx="16" cy="16" r="8.6" stroke={MINT} strokeWidth="2.4" />
        <path d={SCALE} stroke={MINT} strokeWidth="1.3" strokeLinecap="round" opacity=".7" />
      </g>
      <path d={INDEX} fill={MINT} />

      <path d={TICK} stroke="#fff" strokeWidth="2.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default Logo;
