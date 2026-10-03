"use client";

import Link from "next/link";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import type { AlertSeverity, DashboardAlert } from "../alerts";

const ICONS = { danger: AlertCircle, warning: AlertTriangle, info: Info } as const;
const TONES: Record<AlertSeverity, string> = {
  danger: "bg-danger-soft text-danger",
  warning: "bg-warning-soft text-warning",
  info: "bg-accent-soft text-link",
};
const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2";

export function AlertStrip({ alerts }: { alerts: DashboardAlert[] }) {
  const { t } = useTranslation();
  const top = alerts.slice(0, 3);
  return (
    <section aria-labelledby="dash-alerts" className="rounded-xl border border-border bg-warning-soft p-4 sm:p-6">
      <h2 id="dash-alerts" className="mb-4 flex items-center gap-2 text-base font-semibold text-warning">
        <AlertTriangle size={20} aria-hidden="true" />
        {t("dashboard.alertsTitle")}
      </h2>
      {top.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-text-muted">
          {t("dashboard.alertsEmpty")}
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-3">
          {top.map((a) => {
            const Icon = ICONS[a.severity];
            const isDanger = a.severity === "danger";
            return (
              <li
                key={a.id}
                data-testid="dashboard-alert"
                className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-level-1)]"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${TONES[a.severity]}`}
                  >
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <p className="text-sm font-medium text-text">{t(`dashboard.alert.${a.kind}`, a.params)}</p>
                </div>
                <Link
                  href={a.href}
                  className={`inline-flex min-h-11 items-center justify-center self-end rounded-lg px-4 text-sm font-medium transition-colors ${focus} ${
                    isDanger
                      ? "bg-danger text-white hover:bg-danger-hover"
                      : "border border-border-strong bg-surface text-text hover:bg-surface-muted"
                  }`}
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
