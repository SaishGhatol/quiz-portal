import React, { forwardRef, useId } from 'react';

export const inputClass =
  'w-full h-11 px-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white ' +
  'placeholder-gray-400 dark:placeholder-gray-500 shadow-card focus:outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 ' +
  'disabled:opacity-60 aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:ring-red-500/15';

/**
 * Labelled text input. `icon` sits on the left, `trailing` (e.g. a show-password
 * button) on the right; `error` replaces `hint` and marks the field invalid.
 */
const Input = forwardRef(({ label, hint, error, icon: Icon, trailing, labelAction, id, className = '', ...props }, ref) => {
  const autoId = useId();
  const inputId = id || autoId;
  const msgId = `${inputId}-msg`;

  return (
    <div className={className}>
      {(label || labelAction) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
          {labelAction}
        </div>
      )}
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? msgId : undefined}
          className={`${inputClass} ${Icon ? 'pl-10' : ''} ${trailing ? 'pr-11' : ''}`}
          {...props}
        />
        {trailing && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {(error || hint) && (
        <p id={msgId} className={`text-xs mt-1.5 ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
