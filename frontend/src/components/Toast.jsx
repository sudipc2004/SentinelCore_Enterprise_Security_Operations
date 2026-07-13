import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

const icons = {
  error: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((items) => items.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = crypto.randomUUID();

    setToasts((items) => [...items, { id, message, type }]);

    if (duration > 0) {
      window.setTimeout(() => dismissToast(id), duration);
    }
  }, [dismissToast]);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} role="region" aria-label="Notifications">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }) {
  const Icon = icons[toast.type] || Info;

  return (
    <div className={`${styles.toast} ${styles[toast.type] || styles.info}`} role="status">
      <Icon className={styles.icon} aria-hidden="true" />
      <p className={styles.message}>{toast.message}</p>
      <button type="button" className={styles.close} onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
        <X className={styles.closeIcon} aria-hidden="true" />
      </button>
    </div>
  );
}

export default Toast;
