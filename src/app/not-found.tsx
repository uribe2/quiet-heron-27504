"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-xl border border-border bg-surface px-6 py-16 text-center">
      <p aria-hidden="true" className="select-none text-7xl font-semibold tracking-tight text-accent-soft sm:text-8xl [-webkit-text-stroke:2px_var(--border-strong)]">
        404
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-text">{t("common.notFoundTitle")}</h1>
      <p className="text-sm text-text-muted">{t("common.notFoundBody")}</p>
      <Link
        href="/"
        className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        <Home size={16} aria-hidden="true" />
        {t("common.backToHome")}
      </Link>
    </div>
  );
}
