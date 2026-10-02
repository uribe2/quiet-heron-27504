"use client";

import Link from "next/link";
import { useTranslation } from "@/context/i18n-context";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useTranslation();

  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-text">{t("common.errorTitle")}</h1>
      <p className="text-sm text-text-muted">{t("common.errorBody")}</p>
      <div className="flex items-center gap-4">
        <Button onClick={reset}>{t("common.retry")}</Button>
        <Link href="/" className="text-link underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {t("common.backToHome")}
        </Link>
      </div>
    </div>
  );
}
