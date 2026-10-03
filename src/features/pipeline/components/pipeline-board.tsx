"use client";

import { useTranslation } from "@/context/i18n-context";
import { OPPORTUNITY_STAGES } from "../types";
import { columnTotals, stageLabelKey, type PipelineColumns } from "../logic";
import { OpportunityCard, type OpportunityCardHandlers } from "./opportunity-card";

interface PipelineBoardProps extends OpportunityCardHandlers {
  columns: PipelineColumns;
  clientNames: Record<string, string>;
}

export function PipelineBoard({ columns, clientNames, ...handlers }: PipelineBoardProps) {
  const { t, formatMoney } = useTranslation();
  const totals = columnTotals(columns);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:overflow-visible">
      {OPPORTUNITY_STAGES.map((stage) => {
        const label = t(stageLabelKey(stage));
        return (
          <section key={stage} aria-label={label} className="flex min-w-64 flex-col gap-3 rounded-xl border border-border bg-surface-muted p-3 md:min-w-0">
            <header className="flex flex-col gap-1 px-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-text">{label}</h2>
                <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-medium text-text-muted">
                  {totals[stage].count === 1 ? t("pipeline.columnCountOne") : t("pipeline.columnCount", { count: totals[stage].count })}
                </span>
              </div>
              <p className="text-sm font-semibold text-text">{formatMoney(totals[stage].totalCents)}</p>
            </header>
            {columns[stage].length === 0 ? (
              <p className="rounded-lg border border-dashed border-border-strong px-3 py-6 text-center text-xs text-text-muted">{t("pipeline.columnEmpty")}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {columns[stage].map((o) => (
                  <OpportunityCard key={o.id} opportunity={o} clientName={clientNames[o.clientId] ?? "—"} {...handlers} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
