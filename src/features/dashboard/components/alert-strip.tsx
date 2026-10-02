"use client";

import Link from "next/link";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { Card } from "@/components/ui/card";
import type { AlertSeverity, DashboardAlert } from "../alerts";

const ICONS = { danger: AlertCircle, warning: AlertTriangle, info: Info } as const;
const TONES: Record<AlertSeverity, string> = {
  danger: "text-danger",
  warning: "text-warning",
  info: "text-link",
};

export function AlertStrip({ alerts }: { alerts: DashboardAlert[] }) {
  const { t } = useTranslation();
  const top = alerts.slice(0, 3);
  return (
    <section aria-labelledby="dash-alerts">
      <h2 id="dash-alerts" className="mb-3 text-base font-semibold text-text">
        {t("dashboard.alertsTitle")}
      </h2>
      {top.length === 0 ? (
        <Card>
          <p className="text-sm text-text-muted">{t("dashboard.alertsEmpty")}</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {top.map((a) => {
            const Icon = ICONS[a.severity];
            return (
              <li
                key={a.id}
                data-testid="dashboard-alert"
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <p className={`flex items-center gap-2 text-sm font-medium ${TONES[a.severity]}`}>
                  <Icon size={18} aria-hidden="true" />
                  <span>{t(`dashboard.alert.${a.kind}`, a.params)}</span>
                </p>
                <Link
                  href={a.href}
                  className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium text-text hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                >
                  {t(a.actionKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
