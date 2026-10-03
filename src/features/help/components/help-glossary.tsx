"use client";

import { useTranslation } from "@/context/i18n-context";

const TERMS = ["Kpi", "Mrr", "Nit", "Ai", "Pipeline", "Overdue", "Health"] as const;
const TIPS = ["Tab", "Enter", "Lang", "Status"] as const;

export function HelpGlossary() {
  const { t } = useTranslation();
  return (
    <>
      <section aria-labelledby="help-glossary" className="flex flex-col gap-4">
        <h2 id="help-glossary" className="border-l-2 border-accent pl-3 text-xl font-semibold tracking-tight text-text">
          {t("help.glossaryTitle")}
        </h2>
        <dl className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
          {TERMS.map((k) => (
            <div key={k} className="flex flex-col gap-1 p-4 hover:bg-surface-muted sm:flex-row sm:gap-6">
              <dt className="w-48 shrink-0 text-sm font-semibold text-text">{t(`help.term${k}`)}</dt>
              <dd className="text-sm text-text-muted">{t(`help.term${k}Def`)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-labelledby="help-tips" className="flex flex-col gap-4">
        <h2 id="help-tips" className="border-l-2 border-accent pl-3 text-xl font-semibold tracking-tight text-text">
          {t("help.tipsTitle")}
        </h2>
        <ul className="flex list-disc flex-col gap-2 rounded-xl border border-border bg-surface p-5 pl-9 text-sm text-text marker:text-accent">
          {TIPS.map((k) => (
            <li key={k}>{t(`help.tip${k}`)}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
