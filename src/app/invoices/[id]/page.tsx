"use client";

import { useParams } from "next/navigation";
import { useTranslation } from "@/context/i18n-context";
import { PageHeader } from "@/components/ui/page-header";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  return (
    <PageHeader
      title={t("invoices.title")}
      breadcrumbs={[{ label: t("invoices.title"), href: "/invoices" }, { label: id }]}
    />
  );
}
