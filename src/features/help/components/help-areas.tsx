"use client";

import { useTranslation } from "@/context/i18n-context";

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
      <h2 id="help-areas" className="text-xl font-semibold text-text">
        {t("help.areasTitle")}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {AREAS.map((area) => (
          <article key={area.key} className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-base font-semibold text-text">{t(`help.area${area.key}`)}</h3>
            <p className="mt-1 text-sm text-text-muted">{t(`help.area${area.key}Desc`)}</p>
            <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm text-text">
              {area.mods.map((m) => (
                <li key={m}>{t(`help.mod${m}`)}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
