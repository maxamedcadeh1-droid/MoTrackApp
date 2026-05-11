import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Toast } from './Layout';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastState = {
  show: boolean;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const hideTimer = useRef<number | null>(null);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'info',
  });

  const closeToast = useCallback(() => {
    setToast((current) => ({ ...current, show: false }));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
    }

    setToast({ show: true, message, type });
    hideTimer.current = window.setTimeout(() => {
      setToast((current) => ({ ...current, show: false }));
    }, 3500);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast isVisible={toast.show} message={toast.message} type={toast.type} onClose={closeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}
