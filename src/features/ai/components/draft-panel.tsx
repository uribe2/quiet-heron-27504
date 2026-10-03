"use client";

import { useState } from "react";
import { PenLine, AlertTriangle } from "lucide-react";
import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/context/toast-context";
import { useInteractions } from "@/features/interactions/use-interactions";
import { getNowISO } from "@/lib/dates";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAI } from "../use-ai";
import type { DraftChannel, DraftTone } from "../mock-ai";

export function DraftPanel({ initialClientId, initialGoal }: { initialClientId: string; initialGoal: string }) {
  const { t } = useTranslation();
  const { data } = useData();
  const { show } = useToast();
  const { createInteraction } = useInteractions();
  const { draft, retry, isLoading, error } = useAI();
  const [clientId, setClientId] = useState(initialClientId);
  const [channel, setChannel] = useState<DraftChannel>("email");
  const [tone, setTone] = useState<DraftTone>("formal");
  const [goal, setGoal] = useState(initialGoal);
  const [text, setText] = useState<string | null>(null);

  const activeClients = data.clients.filter((c) => c.status === "active");

  async function generate() {
    const value = await draft({ clientId, channel, tone, goal });
    if (value !== null) setText(value);
  }

  async function handleRetry() {
    const value = await retry();
    if (value !== null) setText(value);
  }

  async function copy() {
    if (text === null) return;
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      show({ message: t("ai.copyUnavailable") });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      show({ message: t("ai.copied") });
    } catch {
      show({ message: t("ai.copyUnavailable") });
    }
  }

  function register() {
    if (text === null || !clientId) return;
    createInteraction({
      clientId,
      channel,
      occurredAt: getNowISO(),
      summary: text.trim().slice(0, 500) || goal,
      sentiment: "neutral",
    });
    show({ message: t("ai.registered") });
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-xl font-semibold text-text">
        <PenLine className="h-5 w-5 text-accent" aria-hidden="true" />
        {t("ai.draftTitle")}
      </h2>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
        {t("ai.draftClient")}
        <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="" disabled />
          {activeClients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
          {t("ai.draftChannel")}
          <Select value={channel} onChange={(e) => setChannel(e.target.value as DraftChannel)}>
            <option value="email">{t("ai.channelEmail")}</option>
            <option value="whatsapp">{t("ai.channelWhatsapp")}</option>
          </Select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
          {t("ai.draftTone")}
          <Select value={tone} onChange={(e) => setTone(e.target.value as DraftTone)}>
            <option value="formal">{t("ai.toneFormal")}</option>
            <option value="friendly">{t("ai.toneFriendly")}</option>
          </Select>
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
        {t("ai.draftGoal")}
        <Input value={goal} placeholder={t("ai.draftGoalPlaceholder")} onChange={(e) => setGoal(e.target.value)} />
      </label>
      <div>
        <Button onClick={() => void generate()} isLoading={isLoading} disabled={!clientId}>
          {t("ai.generateDraft")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2" role="status" aria-label={t("ai.draftGenerating")}>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : null}
      {error && !isLoading ? (
        <div role="alert" className="flex flex-col items-start gap-2 rounded-lg bg-danger-soft p-4 text-sm text-danger">
          <p className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />{t("ai.draftError")}</p>
          <Button variant="secondary" onClick={() => void handleRetry()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : null}
      {text !== null && !isLoading ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="ai-draft-text" className="text-sm font-medium text-text">
            {t("ai.draftTextLabel")}
          </label>
          <Textarea id="ai-draft-text" rows={8} value={text} onChange={(e) => setText(e.target.value)} />
          <p className="text-xs font-medium text-text-muted">{t("common.simulatedResponse")}</p>
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            <Button variant="secondary" onClick={() => void copy()}>
              {t("ai.copy")}
            </Button>
            <Button onClick={register}>{t("ai.registerInteraction")}</Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
