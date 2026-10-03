"use client";

import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/context/toast-context";
import { useTimer } from "@/hooks/use-timer";
import { formatElapsed } from "@/lib/format";
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
    <div className="flex items-center gap-3 rounded-full border border-border bg-surface py-1 pl-4 pr-1 text-sm shadow-[var(--shadow-level-1)]">
      <span aria-hidden="true" className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      <span className="hidden max-w-48 truncate text-text-muted sm:inline">
        {project?.name ?? t("time.unknownProject")}
        {timer.description ? ` · ${timer.description}` : ""}
      </span>
      <span role="timer" aria-label={t("time.elapsedLabel")} className="font-semibold text-text">
        {formatElapsed(elapsedMs)}
      </span>
      <button
        type="button"
        onClick={handleStop}
        className="min-h-11 rounded-full bg-danger-soft px-3 text-xs font-semibold text-danger hover:bg-danger hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        {t("time.stopShort")}
      </button>
    </div>
  );
}
