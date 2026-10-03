"use client";

import { CheckCircle2, X } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";

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
  const { t } = useTranslation();
  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-xl bg-sidebar px-4 py-3 text-sm text-sidebar-text shadow-[var(--shadow-level-2)]"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-bright" aria-hidden="true" />
            {toast.message}
          </span>
          <div className="flex items-center gap-1">
            {toast.actionLabel && toast.onAction ? (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  onDismiss(toast.id);
                }}
                className="min-h-11 rounded-md px-2 font-semibold text-accent-bright hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright"
              >
                {toast.actionLabel}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label={t("common.close")}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-sidebar-muted hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
