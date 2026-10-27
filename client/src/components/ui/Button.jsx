import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:   'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20',
  secondary: 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-card',
  soft:      'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-500/20',
  ghost:     'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
  danger:    'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20',
  success:   'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20',
  inverse:   'bg-white text-brand-700 hover:bg-brand-50 shadow-sm',
  // For use on solid brand-coloured surfaces
  glass:     'bg-white/10 text-white border border-white/25 hover:bg-white/20',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
};

const ICON_SIZE = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-4.5 w-4.5' };

/**
 * One button for the whole app. Renders a <Link> when `to` is set, an <a> for `href`,
 * otherwise a <button>. `icon` / `iconRight` take a lucide component.
 */
const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  to,
  href,
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}, ref) => {
  const cls = [
    'inline-flex items-center justify-center font-semibold whitespace-nowrap select-none',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ');

  const content = (
    <>
      {loading
        ? <Loader2 className={`${ICON_SIZE[size]} animate-spin`} aria-hidden="true" />
        : Icon && <Icon className={`${ICON_SIZE[size]} shrink-0`} aria-hidden="true" />}
      {children}
      {IconRight && !loading && <IconRight className={`${ICON_SIZE[size]} shrink-0`} aria-hidden="true" />}
    </>
  );

  if (to && !disabled) return <Link ref={ref} to={to} className={cls} {...rest}>{content}</Link>;
  if (href && !disabled) return <a ref={ref} href={href} className={cls} {...rest}>{content}</a>;

  return (
    <button ref={ref} type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
