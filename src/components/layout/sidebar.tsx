"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { LayoutGrid, Plus } from "lucide-react";
import { navGroups } from "./nav-config";
import { Logo } from "./logo";
import { useTranslation, type Lang } from "@/context/i18n-context";
import { useData } from "@/context/data-context";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Sidebar({
  isOpen,
  onCloseMobile,
  onNewProject,
}: {
  isOpen: boolean;
  onCloseMobile: () => void;
  onNewProject: () => void;
}) {
  const pathname = usePathname();
  const { t, lang, setLang } = useTranslation();
  const { data } = useData();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label={t("common.closeMenu")}
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-sidebar/40 lg:hidden"
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-y-auto bg-sidebar text-sidebar-text transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-5 px-4 pb-4 pt-5">
          <Link
            href="/"
            onClick={onCloseMobile}
            aria-label={t("common.appName")}
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright"
          >
            <Logo onDark />
          </Link>
          <button
            type="button"
            onClick={() => {
              onNewProject();
              onCloseMobile();
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("nav.newProject")}
          </button>
        </div>

        <nav aria-label={t("nav.mainNavigation")} className="flex-1 px-3 pb-4">
          <NavLink href="/" label={t("nav.home")} icon={LayoutGrid} active={pathname === "/"} onClick={onCloseMobile} />
          {navGroups.map((group) => (
            <div key={group.labelKey} className="mt-5">
              <p className="label-eyebrow px-3 text-sidebar-muted">{t(group.labelKey)}</p>
              <ul className="mt-1.5 flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      href={item.href}
                      label={t(item.labelKey)}
                      icon={item.icon}
                      active={isActive(item.href)}
                      onClick={onCloseMobile}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-active px-4 py-4">
          <div className="flex items-center gap-1 text-sm">
            <FooterLink href="/help" label={t("nav.help")} active={pathname === "/help"} onClick={onCloseMobile} />
            <FooterLink href="/settings" label={t("nav.settings")} active={pathname === "/settings"} onClick={onCloseMobile} />
          </div>
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-sidebar-active py-2 pl-3 pr-1">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white"
            >
              {initials(data.settings.userName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{data.settings.userName}</p>
              <p className="flex items-center gap-1.5 text-xs text-sidebar-muted">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent-bright" />
                {data.settings.plan}
              </p>
            </div>
            <div role="group" aria-label={t("common.languageLabel")} className="flex shrink-0 items-center">
              {(["es", "en"] as Lang[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  aria-pressed={lang === code}
                  onClick={() => setLang(code)}
                  className={`min-h-11 rounded-md px-1.5 text-xs font-semibold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright ${
                    lang === code ? "text-white" : "text-sidebar-muted hover:text-sidebar-text"
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright ${
        active ? "bg-sidebar-active text-white" : "text-sidebar-text hover:bg-sidebar-active/60 hover:text-white"
      }`}
    >
      {active ? (
        <span aria-hidden="true" className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-accent-bright" />
      ) : null}
      <Icon className={`h-5 w-5 ${active ? "text-accent-bright" : "text-sidebar-muted"}`} aria-hidden="true" />
      {label}
    </Link>
  );
}

function FooterLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-11 items-center rounded-md px-2 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-bright ${
        active ? "text-white" : "text-sidebar-muted hover:text-sidebar-text"
      }`}
    >
      {label}
    </Link>
  );
}
