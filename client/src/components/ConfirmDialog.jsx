import React, { useRef } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';

// In-app replacement for window.confirm, so destructive actions match the rest of the UI
const ConfirmDialog = ({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  busy = false,
  onConfirm,
  onCancel,
}) => {
  const confirmRef = useRef(null);
  const Icon = destructive ? AlertTriangle : HelpCircle;

  return (
    <Modal open={open} onClose={() => !busy && onCancel?.()} dismissible={!busy} showClose={false} labelledBy="confirm-title" size="sm" initialFocusRef={confirmRef}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>{cancelLabel}</Button>
          <Button ref={confirmRef} variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }>
      <div className="flex gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          destructive ? 'bg-red-50 dark:bg-red-500/10' : 'bg-brand-50 dark:bg-brand-500/10'
        }`}>
          <Icon className={`h-5 w-5 ${destructive ? 'text-red-500' : 'text-brand-500'}`} aria-hidden="true" />
        </div>
        <div className="pt-1">
          <h3 id="confirm-title" className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
          {message && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{message}</p>}
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
