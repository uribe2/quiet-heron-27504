"use client";

import { useState } from "react";
import { Play, Square } from "lucide-react";
import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/context/toast-context";
import { useTimer } from "@/hooks/use-timer";
import { formatElapsed } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useTimeEntries } from "../use-time-entries";

export function TimerCard() {
  const { data } = useData();
  const { t } = useTranslation();
  const { show } = useToast();
  const { runningTimer, startTimer, stopTimer, discardTimer } = useTimeEntries();
  const elapsedMs = useTimer(runningTimer?.startedAt ?? null);
  const [projectId, setProjectId] = useState("");
  const [deliverableId, setDeliverableId] = useState("");
  const [description, setDescription] = useState("");
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const activeProjects = data.projects.filter((p) => p.status === "active");
  const deliverables = data.deliverables.filter((d) => d.projectId === projectId);

  if (runningTimer) {
    const project = data.projects.find((p) => p.id === runningTimer.projectId);
    const deliverable = data.deliverables.find((d) => d.id === runningTimer.deliverableId);
    return (
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-text-muted">{t("time.runningLabel")}</p>
            <p className="text-base font-semibold text-text">
              {project?.name ?? t("time.unknownProject")}
              {deliverable ? ` · ${deliverable.title}` : ""}
            </p>
            {runningTimer.description ? (
              <p className="text-sm text-text-muted">{runningTimer.description}</p>
            ) : null}
          </div>
          <p role="timer" aria-label={t("time.elapsedLabel")} className="font-mono text-3xl font-semibold text-text">
            {formatElapsed(elapsedMs)}
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                stopTimer();
                show({ message: t("time.timerSaved") });
              }}
            >
              <Square className="h-4 w-4" aria-hidden="true" />
              {t("time.stopButton")}
            </Button>
            <Button variant="secondary" onClick={() => setConfirmingDiscard(true)}>
              {t("time.discardButton")}
            </Button>
          </div>
        </div>
        <ConfirmDialog
          isOpen={confirmingDiscard}
          onClose={() => setConfirmingDiscard(false)}
          onConfirm={() => {
            discardTimer();
            show({ message: t("time.timerDiscarded") });
          }}
          title={t("time.discardTitle")}
          description={t("time.discardBody")}
          confirmLabel={t("time.discardConfirm")}
          cancelLabel={t("common.cancel")}
          destructive
        />
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-text">{t("time.timerTitle")}</h2>
      {activeProjects.length === 0 ? (
        <p className="text-sm text-text-muted">{t("time.noActiveProjects")}</p>
      ) : (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!projectId) return;
            startTimer(projectId, description, deliverableId || undefined);
            setDescription("");
            setDeliverableId("");
          }}
        >
          <div className="w-full sm:w-56">
            <FormField label={t("time.fieldProject")} required>
              <Select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setDeliverableId("");
                }}
                required
              >
                <option value="">—</option>
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="w-full sm:w-56">
            <FormField label={t("time.fieldDeliverable")}>
              <Select value={deliverableId} onChange={(e) => setDeliverableId(e.target.value)} disabled={!projectId}>
                <option value="">{t("time.noDeliverable")}</option>
                {deliverables.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="min-w-48 flex-1">
            <FormField label={t("time.fieldDescription")}>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
            </FormField>
          </div>
          <Button type="submit" disabled={!projectId}>
            <Play className="h-4 w-4" aria-hidden="true" />
            {t("time.startButton")}
          </Button>
        </form>
      )}
    </Card>
  );
}
