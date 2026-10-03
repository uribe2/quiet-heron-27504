"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { EmptyState } from "@/components/ui/empty-state";
import { columnTotals, getColumns, stageLabelKey } from "@/features/pipeline/logic";
import type { OpportunityStage } from "@/features/pipeline/types";

const STAGES: OpportunityStage[] = ["contact", "quote", "project", "delivery", "collection"];

export function PipelinePreview() {
  const { t, formatMoney } = useTranslation();
  const { data } = useData();
  const columns = getColumns(data.opportunities);
  const totals = columnTotals(columns);
  const isEmpty = STAGES.every((s) => totals[s].count === 0);
  return (
    <section aria-labelledby="dash-pipeline" className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="dash-pipeline" className="text-xl font-semibold tracking-tight text-text">
          {t("dashboard.pipelineTitle")}
        </h2>
        <Link
          href="/pipeline"
          className="inline-flex min-h-11 items-center gap-1 rounded-lg text-sm font-medium text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          {t("dashboard.viewBoard")}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      {isEmpty ? (
        <EmptyState title={t("dashboard.pipelineEmpty")} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {STAGES.map((s) => (
            <li key={s} className="rounded-xl border border-border bg-surface-muted p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="label-eyebrow text-text-muted">{t(stageLabelKey(s))}</h3>
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-surface px-2 text-xs font-medium text-text">
                  {totals[s].count}
                </span>
              </div>
              <p className="mt-2 text-xl font-semibold text-text">{formatMoney(totals[s].totalCents)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
