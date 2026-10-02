import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { DataProvider } from "@/context/data-context";
import { I18nProvider } from "@/context/i18n-context";
import { ToastProvider } from "@/context/toast-context";

export function ProvidersWrapper({ children }: { children: ReactNode }) {
  return (
    <DataProvider>
      <I18nProvider>
        <ToastProvider>{children}</ToastProvider>
      </I18nProvider>
    </DataProvider>
  );
}

export function renderWithProviders(ui: ReactElement) {
  return render(ui, { wrapper: ProvidersWrapper });
}
