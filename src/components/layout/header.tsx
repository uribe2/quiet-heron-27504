"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { TimerWidget } from "@/features/time/components/timer-widget";
import { IconButton } from "@/components/ui/icon-button";
import { Logo } from "./logo";

export function Header({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur-xl lg:px-8">
      <IconButton aria-label={t("common.openMenu")} onClick={onOpenMobileMenu} className="lg:hidden">
        <Menu className="h-5 w-5" aria-hidden="true" />
      </IconButton>
      <Link
        href="/"
        aria-label={t("common.appName")}
        className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:hidden"
      >
        <Logo />
      </Link>
      <div className="flex-1" />
      <TimerWidget />
    </header>
  );
}
