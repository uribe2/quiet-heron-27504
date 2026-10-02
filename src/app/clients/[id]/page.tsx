"use client";

import { useParams } from "next/navigation";
import { useTranslation } from "@/context/i18n-context";
import { PageHeader } from "@/components/ui/page-header";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  return (
    <PageHeader
      title={t("clients.title")}
      breadcrumbs={[{ label: t("clients.title"), href: "/clients" }, { label: id }]}
    />
  );
}
