"use client";

import { useMemo } from "react";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { getToday } from "@/lib/dates";
import { KpiCard } from "@/components/ui/kpi-card";
import { BarChart } from "@/components/ui/bar-chart";
import { getIncomeKpis, getMonthlySeries } from "../logic";

export function IncomeSummary() {
  const { t, lang, formatMoney, formatDate } = useTranslation();
  const { data } = useData();
  const today = getToday();
  const kpis = getIncomeKpis(data.payments, data.invoices, today);
  const series = useMemo(
    () => getMonthlySeries(data.payments, data.invoices, today),
    [data.payments, data.invoices, today],
  );
  const compact = useMemo(
    () =>
      new Intl.NumberFormat(lang, {
        style: "currency",
        currency: data.settings.currency,
        notation: "compact",
        maximumFractionDigits: 1,
      }),
    [lang, data.settings.currency],
  );

  return (
    <section className="mb-8 flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label={t("payments.kpiMonth")} value={formatMoney(kpis.monthCents)} hint={t("payments.kpiMonthHint")} />
        <KpiCard
          label={t("payments.kpiReceivable")}
          value={formatMoney(kpis.receivableCents)}
          hint={t("payments.kpiReceivableHint")}
        />
        <KpiCard label={t("payments.kpiYear")} value={formatMoney(kpis.yearCents)} hint={t("payments.kpiYearHint")} />
      </div>
      <BarChart
        title={t("payments.chartTitle")}
        categoryHeader={t("payments.chartMonthHeader")}
        series={[
          { key: "collected", label: t("payments.chartCollected") },
          { key: "projected", label: t("payments.chartProjected"), hatched: true },
        ]}
        categories={series.map((p) => ({
          label: formatDate(`${p.month}-01`, { month: "short", year: "2-digit" }),
          values: { collected: p.collectedCents, projected: p.projectedCents },
        }))}
        formatValue={(cents) => compact.format(cents / 100)}
        formatFullValue={formatMoney}
      />
    </section>
  );
}
