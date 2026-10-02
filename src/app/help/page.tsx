"use client";

import { useTranslation } from "@/context/i18n-context";
import { PageHeader } from "@/components/ui/page-header";
import { HelpAreas } from "@/features/help/components/help-areas";
import { HelpGlossary } from "@/features/help/components/help-glossary";

export default function HelpPage() {
  const { t } = useTranslation();
  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <PageHeader title={t("help.title")} description={t("help.description")} />
      <HelpAreas />
      <HelpGlossary />
    </div>
  );
}
