import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

const WIDTHS = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

/**
 * Accessible dialog: Escape and backdrop close it (unless `dismissible` is false),
 * focus moves inside on open and returns to the trigger on close, and the page
 * behind stops scrolling.
 */
const Modal = ({ open, onClose, title, description, size = 'md', dismissible = true, showClose = true, footer, children, initialFocusRef, labelledBy }) => {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  // Parents usually pass an inline onClose; reading it through a ref keeps the
  // effect below from re-running (and stealing focus) on every render
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const target = initialFocusRef?.current
      || panelRef.current?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    target?.focus();

    const onKey = e => {
      if (e.key === 'Escape' && dismissible) onCloseRef.current?.();
      // Keep Tab inside the dialog
      if (e.key === 'Tab' && panelRef.current) {
        const nodes = panelRef.current.querySelectorAll('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, dismissible, initialFocusRef]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4"
      role="dialog" aria-modal="true" aria-labelledby={title ? titleId : labelledBy} aria-describedby={description ? descId : undefined}>
      <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-[2px] animate-fade-in" onClick={() => dismissible && onClose?.()} />

      <div ref={panelRef}
        className={`relative w-full ${WIDTHS[size] || WIDTHS.md} bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-pop animate-scale-in max-h-[90vh] flex flex-col`}>
        {title && (
          <div className="px-6 pt-5 pr-14">
            <h2 id={titleId} className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
            {description && <p id={descId} className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
          </div>
        )}
        {dismissible && showClose && (
          <button type="button" onClick={onClose} aria-label="Close"
            className="absolute top-3.5 right-3.5 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
