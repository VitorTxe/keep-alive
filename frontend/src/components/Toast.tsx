import { AlertCircle, CheckCircle2, Info, X, type LucideIcon } from 'lucide-react';
import type { ToastMessage, ToastType } from '../types';

interface ToastStyle {
  wrapper: string;
  icon: LucideIcon;
  iconClass: string;
}

const TOAST_STYLES: Record<ToastType, ToastStyle> = {
  success: {
    wrapper: 'bg-zinc-900/95 border-emerald-500/30 text-zinc-100',
    icon: CheckCircle2,
    iconClass: 'text-emerald-400',
  },
  error: {
    wrapper: 'bg-zinc-900/95 border-rose-500/30 text-zinc-100',
    icon: AlertCircle,
    iconClass: 'text-rose-400',
  },
  info: {
    wrapper: 'bg-zinc-900/95 border-zinc-700 text-zinc-100',
    icon: Info,
    iconClass: 'text-zinc-400',
  },
};

export interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
        const Icon = style.icon;

        return (
          <div
            key={toast.id}
            role="alert"
            className={`flex items-start gap-3 rounded-xl border p-3.5 shadow-2xl backdrop-blur-md transition-all ${style.wrapper}`}
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconClass}`} />
            <div className="min-w-0 flex-1">
              {toast.title && (
                <p className="text-xs font-semibold text-zinc-100">{toast.title}</p>
              )}
              <p className="text-xs leading-relaxed text-zinc-300">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              aria-label="Fechar notificação"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
