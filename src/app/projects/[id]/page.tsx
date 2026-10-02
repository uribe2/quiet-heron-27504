"use client";

import { useParams } from "next/navigation";
import { useTranslation } from "@/context/i18n-context";
import { PageHeader } from "@/components/ui/page-header";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  return (
    <PageHeader
      title={t("projects.title")}
      breadcrumbs={[{ label: t("projects.title"), href: "/projects" }, { label: id }]}
    />
  );
}
