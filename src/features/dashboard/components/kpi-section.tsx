"use client";

import { Banknote, Clock, Receipt } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { getToday } from "@/lib/dates";
import { KpiCard } from "@/components/ui/kpi-card";
import { getIncomeKpis } from "@/features/payments/logic";
import { getBillableHoursThisWeek } from "@/features/time/logic";

export function KpiSection() {
  const { t, formatMoney, formatNumber } = useTranslation();
  const { data } = useData();
  const today = getToday();
  const income = getIncomeKpis(data.payments, data.invoices, today);
  const hours = getBillableHoursThisWeek(data.timeEntries, today);
  return (
    <section aria-labelledby="dash-kpis">
      <h2 id="dash-kpis" className="sr-only">
        {t("dashboard.kpisTitle")}
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label={t("dashboard.kpiIncome")}
          value={formatMoney(income.monthCents)}
          icon={<Banknote size={20} aria-hidden="true" />}
        />
        <KpiCard
          label={t("dashboard.kpiReceivable")}
          value={formatMoney(income.receivableCents)}
          icon={<Receipt size={20} aria-hidden="true" />}
        />
        <KpiCard
          label={t("dashboard.kpiHours")}
          value={t("dashboard.hoursValue", { hours: formatNumber(hours) })}
          icon={<Clock size={20} aria-hidden="true" />}
        />
      </div>
    </section>
  );
}
