import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Toast } from './Toast';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  /** A single action shown on the toast, e.g. Undo. Tapping it runs it and closes the toast. */
  action?: { label: string; onPress: () => void };
  /** How long it stays up. Longer is kinder when there's an action. */
  durationMs?: number;
}

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
  action?: ToastOptions['action'];
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION_MS = 2600;

/** Mounted once at the app root (see app/_layout.tsx). Replaces the
 * Alert.alert-only error handling this app previously relied on — Alert
 * still makes sense for anything that needs a blocking confirmation, but
 * ordinary success/error feedback now has a proper non-blocking toast. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, tone: ToastTone = 'success', options?: ToastOptions) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const id = Date.now();
    setToast({ id, message, tone, action: options?.action });
    timeoutRef.current = setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, options?.durationMs ?? (options?.action ? 5000 : DURATION_MS));
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  const runAction = () => {
    const action = toast?.action;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast(null);
    action?.onPress();
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          tone={toast.tone}
          actionLabel={toast.action?.label}
          onAction={toast.action ? runAction : undefined}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
