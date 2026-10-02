"use client";

import Link from "next/link";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { Card } from "@/components/ui/card";
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
    <section aria-labelledby="dash-pipeline">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="dash-pipeline" className="text-base font-semibold text-text">
          {t("dashboard.pipelineTitle")}
        </h2>
        <Link
          href="/pipeline"
          className="text-sm font-medium text-link underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          {t("dashboard.viewBoard")}
        </Link>
      </div>
      {isEmpty ? (
        <EmptyState title={t("dashboard.pipelineEmpty")} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {STAGES.map((s) => (
            <li key={s}>
              <Card className="p-4">
                <h3 className="text-sm font-medium text-text-muted">{t(stageLabelKey(s))}</h3>
                <p className="mt-1 text-xl font-semibold text-text">{totals[s].count}</p>
                <p className="text-xs text-text-muted">{formatMoney(totals[s].totalCents)}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
