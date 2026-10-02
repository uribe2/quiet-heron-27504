"use client";

import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { getToday } from "@/lib/dates";
import { KpiCard } from "@/components/ui/kpi-card";
import { getIncomeKpis } from "@/features/payments/logic";
import { getBillableHoursThisWeek } from "@/features/time/logic";

export function KpiSection() {
  const { t, formatMoney } = useTranslation();
  const { data } = useData();
  const today = getToday();
  const income = getIncomeKpis(data.payments, data.invoices, today);
  const hours = getBillableHoursThisWeek(data.timeEntries, today);
  return (
    <section aria-labelledby="dash-kpis">
      <h2 id="dash-kpis" className="sr-only">
        {t("dashboard.kpisTitle")}
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label={t("dashboard.kpiIncome")} value={formatMoney(income.monthCents)} />
        <KpiCard label={t("dashboard.kpiReceivable")} value={formatMoney(income.receivableCents)} />
        <KpiCard label={t("dashboard.kpiHours")} value={t("dashboard.hoursValue", { hours })} />
      </div>
    </section>
  );
}
