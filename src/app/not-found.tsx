"use client";

import Link from "next/link";
import { useTranslation } from "@/context/i18n-context";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-text">{t("common.notFoundTitle")}</h1>
      <p className="text-sm text-text-muted">{t("common.notFoundBody")}</p>
      <Link href="/" className="text-link underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
        {t("common.backToHome")}
      </Link>
    </div>
  );
}
