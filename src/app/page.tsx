"use client";

import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { PageHeader } from "@/components/ui/page-header";

export default function Home() {
  const { t } = useTranslation();
  const { data } = useData();

  return (
    <PageHeader
      title={t("dashboard.title")}
      description={t("dashboard.greeting", { name: data.settings.userName })}
    />
  );
}
