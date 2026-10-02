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
    <div className="grid gap-4 overflow-x-auto pb-2 md:grid-cols-5">
      {OPPORTUNITY_STAGES.map((stage) => {
        const label = t(stageLabelKey(stage));
        return (
          <section key={stage} aria-label={label} className="flex min-w-60 flex-col gap-3 rounded-xl bg-bg p-2">
            <header>
              <h2 className="text-sm font-semibold text-text">{label}</h2>
              <p className="text-xs text-text-muted">
                {t("pipeline.columnCount", { count: totals[stage].count })} · {formatMoney(totals[stage].totalCents)}
              </p>
            </header>
            {columns[stage].length === 0 ? (
              <p className="text-xs text-text-muted">{t("pipeline.columnEmpty")}</p>
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
