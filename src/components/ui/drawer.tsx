"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "./icon-button";
import { Breadcrumbs, type BreadcrumbItem } from "./breadcrumbs";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  breadcrumbs?: BreadcrumbItem[];
  children: ReactNode;
  footer?: ReactNode;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  closeLabel,
  breadcrumbs,
  children,
  footer,
}: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    // Escape fires "cancel": route it through onClose so callers can intercept
    // (e.g. a "discard changes?" prompt). "close" also fires when the parent closes
    // the drawer programmatically, so it only restores focus.
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    const handleClose = () => {
      previouslyFocused.current?.focus();
    };
    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", handleClose);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="drawer-title"
      className="fixed inset-y-0 right-0 m-0 h-full w-full max-w-[480px] max-h-full overflow-hidden rounded-l-xl border-none bg-surface p-0 shadow-[var(--shadow-level-2)]"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0">
            {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
            <h2 id="drawer-title" className="mt-2 text-xl font-semibold tracking-tight text-text">
              {title}
            </h2>
          </div>
          <IconButton aria-label={closeLabel} onClick={onClose}>
            <X className="h-5 w-5" aria-hidden="true" />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer ? (
          <footer className="sticky bottom-0 border-t border-border bg-surface-muted px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}
