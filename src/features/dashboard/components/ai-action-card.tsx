"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { getToday } from "@/lib/dates";
import { getSuggestedActions } from "@/features/ai/logic";

export function AiActionCard() {
  const { t } = useTranslation();
  const { data } = useData();
  const action = getSuggestedActions(data, getToday())[0];
  return (
    <section aria-labelledby="dash-ai">
      <h2 id="dash-ai" className="mb-4 text-xl font-semibold tracking-tight text-text">
        {t("dashboard.aiTitle")}
      </h2>
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-accent-soft p-5">
        <Sparkles size={22} className="text-accent" aria-hidden="true" />
        <p className="text-sm leading-6 text-text">
          {action ? t(`ai.action.${action.kind}`, action.params) : t("ai.actionsEmpty")}
        </p>
        <Link
          href="/ai"
          className="inline-flex min-h-11 items-center gap-1 self-start rounded-lg text-sm font-medium text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          {t("dashboard.openAi")}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
