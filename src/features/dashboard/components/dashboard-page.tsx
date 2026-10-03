"use client";

import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { getToday } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { useAlerts } from "../use-alerts";
import { AlertStrip } from "./alert-strip";
import { KpiSection } from "./kpi-section";
import { ActiveProjects } from "./active-projects";
import { AiActionCard } from "./ai-action-card";
import { PipelinePreview } from "./pipeline-preview";

export function DashboardPage() {
  const { t, formatDate } = useTranslation();
  const { data } = useData();
  const alerts = useAlerts();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t("dashboard.heading")}
        description={`${t("dashboard.greeting", { name: data.settings.userName })} · ${formatDate(getToday())} · ${t("dashboard.attention", { count: alerts.length })}`}
      />
      <AlertStrip alerts={alerts} />
      <KpiSection />
      <div className="grid items-start gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActiveProjects />
        </div>
        <AiActionCard />
      </div>
      <PipelinePreview />
    </div>
  );
}
