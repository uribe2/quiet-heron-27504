"use client";

import Link from "next/link";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { getToday } from "@/lib/dates";
import { Card } from "@/components/ui/card";
import { getSuggestedActions } from "@/features/ai/logic";

export function AiActionCard() {
  const { t } = useTranslation();
  const { data } = useData();
  const action = getSuggestedActions(data, getToday())[0];
  return (
    <section aria-labelledby="dash-ai">
      <h2 id="dash-ai" className="mb-3 text-base font-semibold text-text">
        {t("dashboard.aiTitle")}
      </h2>
      <Card className="flex flex-col gap-3 bg-accent-soft p-4">
        <p className="text-sm text-text">
          {action ? t(`ai.action.${action.kind}`, action.params) : t("ai.actionsEmpty")}
        </p>
        <Link
          href="/ai"
          className="text-sm font-medium text-link underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          {t("dashboard.openAi")}
        </Link>
      </Card>
    </section>
  );
}
