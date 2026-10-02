"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { getToday } from "@/lib/dates";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useAI } from "../use-ai";
import { getClientHealth, type HealthLabel } from "../logic";

const TONES: Record<HealthLabel, "success" | "warning" | "danger"> = {
  healthy: "success",
  attention: "warning",
  critical: "danger",
};

const LABEL_KEYS: Record<HealthLabel, string> = {
  healthy: "ai.healthHealthy",
  attention: "ai.healthAttention",
  critical: "ai.healthCritical",
};

export function SummarySection() {
  const { t } = useTranslation();
  const { data } = useData();
  const { summarize, isLoading, error, result, retry } = useAI();
  const [period, setPeriod] = useState("7");

  useEffect(() => {
    void summarize(Number(period));
  }, [summarize, period]);

  const health = useMemo(() => {
    const today = getToday();
    return data.clients
      .filter((c) => c.status === "active")
      .map((c) => ({ client: c, health: getClientHealth(c.id, data, today) }));
  }, [data]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-text">{t("ai.summaryTitle")}</h2>
          <div className="flex items-end gap-2">
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              {t("ai.periodLabel")}
              <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-32">
                <option value="7">{t("ai.period7")}</option>
                <option value="30">{t("ai.period30")}</option>
              </Select>
            </label>
            <Button variant="secondary" onClick={() => void summarize(Number(period))} disabled={isLoading}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {t("ai.regenerate")}
            </Button>
          </div>
        </div>
        {isLoading ? (
          <div className="flex flex-col gap-2" role="status" aria-label={t("common.loading")}>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : error ? (
          <div role="alert" className="flex flex-col items-start gap-2 text-sm text-danger">
            <p>{t("ai.summaryError")}</p>
            <Button variant="secondary" onClick={() => void retry()}>
              {t("common.retry")}
            </Button>
          </div>
        ) : (
          <div aria-live="polite" className="flex flex-col gap-2">
            <p className="whitespace-pre-line text-sm text-text">{result}</p>
            {result ? <p className="text-xs text-text-muted">{t("common.simulatedResponse")}</p> : null}
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text">{t("ai.healthTitle")}</h2>
        {health.length === 0 ? (
          <p className="text-sm text-text-muted">{t("ai.healthNoClients")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {health.map(({ client, health: h }) => (
              <li key={client.id}>
                <ProgressBar
                  percent={h.score}
                  tone={TONES[h.label]}
                  label={`${client.name} · ${t(LABEL_KEYS[h.label])}`}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
