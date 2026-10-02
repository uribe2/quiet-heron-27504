"use client";

export interface ToastData {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastViewportProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-full max-w-sm items-center justify-between gap-3 rounded-lg border border-border bg-text px-4 py-3 text-sm text-white shadow-lg"
        >
          <span>{toast.message}</span>
          <div className="flex items-center gap-3">
            {toast.actionLabel && toast.onAction ? (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  onDismiss(toast.id);
                }}
                className="font-semibold text-accent underline focus-visible:ring-2 focus-visible:ring-focus"
              >
                {toast.actionLabel}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Cerrar"
              className="text-white/70 hover:text-white focus-visible:ring-2 focus-visible:ring-focus"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
