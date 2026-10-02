"use client";

import { Clock, Square } from "lucide-react";
import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/context/toast-context";
import { useTimer } from "@/hooks/use-timer";
import { formatElapsed } from "@/lib/format";
import { IconButton } from "@/components/ui/icon-button";
import { useTimeEntries } from "../use-time-entries";

/** Running-timer widget shown in the app header. Renders nothing when no timer runs. */
export function TimerWidget() {
  const { data } = useData();
  const { t } = useTranslation();
  const { show } = useToast();
  const { stopTimer } = useTimeEntries();
  const timer = data.runningTimer;
  const elapsedMs = useTimer(timer?.startedAt ?? null);

  if (!timer) return null;

  const project = data.projects.find((p) => p.id === timer.projectId);

  function handleStop() {
    stopTimer();
    show({ message: t("time.timerSaved") });
  }

  return (
    <div className="flex items-center gap-2 rounded-full bg-accent-soft py-1 pl-3 pr-1 text-sm font-medium text-link">
      <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="max-w-40 truncate">
        {project?.name ?? t("time.unknownProject")}
        {timer.description ? ` · ${timer.description}` : ""}
      </span>
      <span role="timer" aria-label={t("time.elapsedLabel")} className="font-mono">
        {formatElapsed(elapsedMs)}
      </span>
      <IconButton aria-label={t("time.stopButton")} onClick={handleStop} className="text-link">
        <Square className="h-4 w-4" aria-hidden="true" />
      </IconButton>
    </div>
  );
}
