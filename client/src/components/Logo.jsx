import React from 'react';

/**
 * Quiz Portal brand mark.
 * A quiz sheet (3 lines) with a checkmark — clean, scalable SVG.
 * Usage: <Logo size={32} /> or <Logo className="h-8 w-8" />
 */
const Logo = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Quiz Portal logo"
  >
    {/* Background */}
    <rect width="32" height="32" rx="7" fill="#2563EB" />

    {/* Three question lines */}
    <rect x="7" y="9"  width="18" height="2"   rx="1" fill="white" />
    <rect x="7" y="14" width="13" height="2"   rx="1" fill="white" fillOpacity="0.65" />
    <rect x="7" y="19" width="16" height="2"   rx="1" fill="white" fillOpacity="0.65" />

    {/* Checkmark — bottom right, overlaps last line */}
    <path
      d="M19 24.5 L21.5 27 L26 22.5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Logo;
