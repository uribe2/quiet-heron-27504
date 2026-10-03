"use client";

import { useState } from "react";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPendingFollowUps, isFollowUpOverdue, isValidRescheduleDate } from "../logic";
import { getToday } from "@/lib/dates";
import { channelKey } from "./interaction-filters-bar";
import type { Interaction } from "../types";

export function FollowUpsSection({
  interactions,
  clientNames,
  onComplete,
  onReschedule,
}: {
  interactions: Interaction[];
  clientNames: Record<string, string>;
  onComplete: (interaction: Interaction) => void;
  onReschedule: (interaction: Interaction, date: string) => void;
}) {
  const { t, formatDate } = useTranslation();
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [invalid, setInvalid] = useState(false);
  const pending = getPendingFollowUps(interactions);
  const today = getToday();

  function startReschedule(item: Interaction) {
    setReschedulingId(item.id);
    setNewDate(item.followUpDate ?? today);
    setInvalid(false);
  }

  function saveReschedule(item: Interaction) {
    if (!isValidRescheduleDate(item, newDate)) {
      setInvalid(true);
      return;
    }
    onReschedule(item, newDate);
    setReschedulingId(null);
  }

  return (
    <Card>
      <section aria-labelledby="follow-ups-title">
        <h2 id="follow-ups-title" className="mb-4 flex items-center gap-2 text-lg font-semibold text-text">
          <CalendarClock className="h-5 w-5 text-accent" aria-hidden="true" />
          {t("interactions.followUpsTitle")}
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-text-muted">{t("interactions.followUpsEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((item) => {
              const overdue = isFollowUpOverdue(item, today);
              const editing = reschedulingId === item.id;
              const dateId = `reschedule-${item.id}`;
              return (
                <li
                  key={item.id}
                  className={`flex flex-col gap-2 rounded-lg border p-4 ${
                    overdue ? "border-danger/30 bg-danger-soft" : "border-border bg-surface-muted"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-text">{clientNames[item.clientId] ?? "—"}</span>
                    <span className="text-text-muted">{t(channelKey(item.channel))}</span>
                    <span className="text-text-muted">
                      {t("interactions.followUpDue", { date: formatDate(item.followUpDate as string) })}
                    </span>
                    {overdue ? (
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-danger" aria-hidden="true" />
                        <StatusBadge label={t("interactions.overdue")} tone="danger" />
                      </span>
                    ) : item.followUpDate === today ? (
                      <StatusBadge label={t("interactions.dueToday")} tone="warning" />
                    ) : null}
                  </div>
                  <p className="text-sm text-text">{item.summary}</p>
                  {editing ? (
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor={dateId} className="text-xs font-medium text-text-muted">
                          {t("interactions.rescheduleDate")}
                        </label>
                        <Input
                          id={dateId}
                          type="date"
                          value={newDate}
                          onChange={(e) => {
                            setNewDate(e.target.value);
                            setInvalid(false);
                          }}
                          aria-invalid={invalid}
                          aria-describedby={invalid ? `${dateId}-error` : undefined}
                        />
                      </div>
                      <Button onClick={() => saveReschedule(item)}>{t("interactions.rescheduleSave")}</Button>
                      <Button variant="secondary" onClick={() => setReschedulingId(null)}>
                        {t("interactions.rescheduleCancel")}
                      </Button>
                      {invalid ? (
                        <p id={`${dateId}-error`} className="w-full text-xs text-danger">
                          <span aria-hidden="true">⚠ </span>
                          {t("interactions.rescheduleInvalid")}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <Button variant="secondary" onClick={() => onComplete(item)}>
                        {t("interactions.markDone")}
                      </Button>
                      <Button variant="secondary" onClick={() => startReschedule(item)}>
                        {t("interactions.reschedule")}
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Card>
  );
}
