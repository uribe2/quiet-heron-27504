"use client";

import { useTranslation } from "@/context/i18n-context";
import { PageHeader } from "@/components/ui/page-header";

export default function DeliverablesPage() {
  const { t } = useTranslation();
  return <PageHeader title={t("deliverables.title")} />;
}
