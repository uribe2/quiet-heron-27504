"use client";

import { useMemo, useState } from "react";
import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { getToday } from "@/lib/dates";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSuggestedActions, type SuggestedAction } from "../logic";
import { DraftPanel } from "./draft-panel";

interface Preset {
  key: number;
  clientId: string;
  goal: string;
}

export function ActionsSection() {
  const { t } = useTranslation();
  const { data } = useData();
  const [preset, setPreset] = useState<Preset>({ key: 0, clientId: "", goal: "" });

  const actions = useMemo(() => getSuggestedActions(data, getToday()), [data]);

  function prepare(action: SuggestedAction) {
    setPreset((p) => ({
      key: p.key + 1,
      clientId: action.clientId,
      goal: t(`ai.actionGoal.${action.kind}`, action.params),
    }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-text">{t("ai.actionsTitle")}</h2>
        {actions.length === 0 ? (
          <p className="text-sm text-text-muted">{t("ai.actionsEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {actions.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
                <span className="text-sm text-text">{t(`ai.action.${a.kind}`, a.params)}</span>
                <Button variant="secondary" onClick={() => prepare(a)}>
                  {t("ai.prepareDraft")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <DraftPanel key={preset.key} initialClientId={preset.clientId} initialGoal={preset.goal} />
    </div>
  );
}
