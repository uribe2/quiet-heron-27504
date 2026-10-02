"use client";

import { Menu, Clock } from "lucide-react";
import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { useTimer } from "@/hooks/use-timer";
import { formatElapsed } from "@/lib/format";
import { IconButton } from "@/components/ui/icon-button";

export function Header({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const { data } = useData();
  const { t } = useTranslation();
  const elapsedMs = useTimer(data.runningTimer?.startedAt ?? null);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-surface px-4 lg:px-8">
      <IconButton aria-label={t("common.openMenu")} onClick={onOpenMobileMenu} className="lg:hidden">
        <Menu className="h-5 w-5" aria-hidden="true" />
      </IconButton>
      <div className="flex-1" />
      {data.runningTimer ? (
        <div className="flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-link">
          <Clock className="h-4 w-4" aria-hidden="true" />
          <span>{data.runningTimer.description || t("nav.time")}</span>
          <span aria-live="polite" className="font-mono">
            {formatElapsed(elapsedMs)}
          </span>
        </div>
      ) : null}
    </header>
  );
}
