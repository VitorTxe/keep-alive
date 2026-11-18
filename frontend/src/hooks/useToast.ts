import { useCallback, useState } from 'react';
import type { ShowToastFn, ToastInput, ToastMessage } from '../types';

export interface UseToastReturn {
  toasts: ToastMessage[];
  showToast: ShowToastFn;
  dismissToast: (id: string) => void;
}

/**
 * Gerencia uma fila de notificações efêmeras (toasts) em estado local,
 * dispensando bibliotecas pesadas de estado global.
 */
export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback<ShowToastFn>(
    ({ type = 'info', title, message, durationMs = 4500 }: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);

      if (durationMs > 0) {
        window.setTimeout(() => {
          dismissToast(id);
        }, durationMs);
      }
    },
    [dismissToast]
  );

  return { toasts, showToast, dismissToast };
}
