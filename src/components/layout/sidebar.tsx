"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Home, HelpCircle, Settings as SettingsIcon, Plus } from "lucide-react";
import { navGroups } from "./nav-config";
import { useTranslation, type Lang } from "@/context/i18n-context";
import { useData } from "@/context/data-context";

export function Sidebar({
  isOpen,
  onCloseMobile,
}: {
  isOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const { t, lang, setLang } = useTranslation();
  const { data } = useData();

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label={t("common.closeMenu")}
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-text/40 lg:hidden"
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto border-r border-border bg-surface transition-transform lg:static lg:z-auto lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-4 border-b border-border p-4">
          <Link href="/" className="text-lg font-semibold text-text" onClick={onCloseMobile}>
            {t("common.appName")}
          </Link>
          <Link
            href="/projects"
            onClick={onCloseMobile}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-text px-4 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("nav.newProject")}
          </Link>
        </div>

        <nav aria-label={t("nav.home")} className="flex-1 px-2 py-4">
          <NavLink href="/" label={t("nav.home")} icon={Home} active={pathname === "/"} onClick={onCloseMobile} />
          {navGroups.map((group) => (
            <div key={group.labelKey} className="mt-4">
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                {t(group.labelKey)}
              </p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      href={item.href}
                      label={t(item.labelKey)}
                      icon={item.icon}
                      active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                      onClick={onCloseMobile}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <ul className="flex flex-col gap-0.5">
            <li>
              <NavLink href="/help" label={t("nav.help")} icon={HelpCircle} active={pathname === "/help"} onClick={onCloseMobile} />
            </li>
            <li>
              <NavLink href="/settings" label={t("nav.settings")} icon={SettingsIcon} active={pathname === "/settings"} onClick={onCloseMobile} />
            </li>
          </ul>
          <div className="mt-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-text">{data.settings.userName}</p>
              <p className="text-xs text-text-muted">{data.settings.plan}</p>
            </div>
            <div>
              <label className="sr-only" htmlFor="lang-switch">
                {t("common.languageLabel")}
              </label>
              <select
                id="lang-switch"
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                className="h-9 rounded-md border border-border bg-surface px-2 text-xs text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <option value="es">ES</option>
                <option value="en">EN</option>
              </select>
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
      className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
        active ? "bg-accent-soft text-text" : "text-text-muted hover:bg-bg hover:text-text"
      }`}
    >
      {active ? (
        <span aria-hidden="true" className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
      ) : null}
      <Icon className="h-5 w-5" aria-hidden="true" />
      {label}
    </Link>
  );
}
