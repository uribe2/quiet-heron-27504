"use client";

import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-xl border border-border bg-surface px-6 py-16 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle size={24} aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight text-text">{t("common.errorTitle")}</h1>
      <p className="text-sm text-text-muted">{t("common.errorBody")}</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>{t("common.retry")}</Button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border-strong bg-surface px-4 text-sm font-medium text-text transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          <Home size={16} aria-hidden="true" />
          {t("common.backToHome")}
        </Link>
      </div>
    </div>
  );
}
