"use client";

import { Menu } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { TimerWidget } from "@/features/time/components/timer-widget";
import { IconButton } from "@/components/ui/icon-button";

export function Header({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-surface px-4 lg:px-8">
      <IconButton aria-label={t("common.openMenu")} onClick={onOpenMobileMenu} className="lg:hidden">
        <Menu className="h-5 w-5" aria-hidden="true" />
      </IconButton>
      <div className="flex-1" />
      <TimerWidget />
    </header>
  );
}
