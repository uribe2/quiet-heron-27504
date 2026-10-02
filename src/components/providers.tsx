"use client";

import type { ReactNode } from "react";
import { DataProvider } from "@/context/data-context";
import { I18nProvider } from "@/context/i18n-context";
import { ToastProvider } from "@/context/toast-context";
import { AppShell } from "@/components/layout/app-shell";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <DataProvider>
      <I18nProvider>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </I18nProvider>
    </DataProvider>
  );
}
