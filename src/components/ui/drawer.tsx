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
    const handleClose = () => {
      onClose();
      previouslyFocused.current?.focus();
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="drawer-title"
      className="fixed inset-y-0 right-0 m-0 h-full w-full max-w-md max-h-full overflow-hidden border-none bg-surface p-0 shadow-xl"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
            <h2 id="drawer-title" className="mt-1 text-lg font-semibold text-text">
              {title}
            </h2>
          </div>
          <IconButton aria-label={closeLabel} onClick={onClose}>
            <X className="h-5 w-5" aria-hidden="true" />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer ? (
          <footer className="sticky bottom-0 border-t border-border bg-surface px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}
