"use client";

import {
  Briefcase,
  Brain,
  CheckSquare,
  Handshake,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/context/i18n-context";

const AREA_ICONS: Record<string, LucideIcon> = {
  Relationship: Users,
  Execution: CheckSquare,
  Closing: Handshake,
  Organization: Briefcase,
  Intelligence: Brain,
};

const AREAS = [
  { key: "Relationship", mods: ["Clients", "Interactions", "Pipeline"] },
  { key: "Execution", mods: ["Projects", "Deliverables", "Time"] },
  { key: "Closing", mods: ["Quotes", "Invoices", "Payments"] },
  { key: "Organization", mods: ["Meetings", "Documents"] },
  { key: "Intelligence", mods: ["Ai"] },
] as const;

export function HelpAreas() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="help-areas" className="flex flex-col gap-4">
      <h2
        id="help-areas"
        className="border-l-2 border-accent pl-3 text-xl font-semibold tracking-tight text-text"
      >
        {t("help.areasTitle")}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {AREAS.map((area) => {
          const Icon = AREA_ICONS[area.key];
          return (
            <article
              key={area.key}
              className="rounded-xl border border-border bg-surface p-5 md:p-6"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Icon size={18} aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-base font-semibold text-text">
                {t(`help.area${area.key}`)}
              </h3>
              <p className="mt-1 text-sm text-text-muted">
                {t(`help.area${area.key}Desc`)}
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm text-text marker:text-accent">
                {area.mods.map((m) => (
                  <li key={m}>{t(`help.mod${m}`)}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
