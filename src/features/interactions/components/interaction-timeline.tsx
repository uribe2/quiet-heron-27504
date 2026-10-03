"use client";

import { Phone, Mail, MessageCircle, Users, StickyNote, type LucideIcon } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { groupInteractionsByDay } from "../logic";
import { channelKey, sentimentKey } from "./interaction-filters-bar";
import type { Interaction, InteractionChannel, Sentiment } from "../types";

const CHANNEL_ICONS: Record<InteractionChannel, LucideIcon> = {
  call: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  meeting: Users,
  note: StickyNote,
};

const SENTIMENT_TONES: Record<Sentiment, StatusTone> = {
  positive: "success",
  neutral: "neutral",
  negative: "danger",
};

export function InteractionTimeline({
  interactions,
  clientNames,
  onEdit,
}: {
  interactions: Interaction[];
  clientNames: Record<string, string>;
  onEdit: (interaction: Interaction) => void;
}) {
  const { t, formatDate, lang } = useTranslation();
  const locale = lang === "es" ? "es-CO" : "en-US";
  const groups = groupInteractionsByDay(interactions);

  return (
    <div className="flex flex-col gap-6" aria-label={t("interactions.timelineLabel")} role="region">
      {groups.map((group) => (
        <section key={group.day} aria-labelledby={`day-${group.day}`}>
          <h3
            id={`day-${group.day}`}
            className="mb-3 flex items-center gap-3 text-sm font-semibold capitalize text-text"
          >
            <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
            <span className="shrink-0">
              {formatDate(group.day, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
          </h3>
          <ul className="ml-1 flex flex-col gap-3 border-l-2 border-border pl-4 sm:pl-6">
            {group.items.map((item) => {
              const Icon = CHANNEL_ICONS[item.channel];
              const time = new Date(item.occurredAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
              return (
                <li key={item.id} className="rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-[var(--shadow-level-1)]">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-text">{clientNames[item.clientId] ?? "—"}</span>
                    <span className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-surface-muted px-2 py-1 text-xs text-text-muted">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {t(channelKey(item.channel))}
                    </span>
                    <span className="text-xs text-text-muted">{time}</span>
                    <StatusBadge
                      label={t("interactions.sentimentLabel", { value: t(sentimentKey(item.sentiment)) })}
                      tone={SENTIMENT_TONES[item.sentiment]}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-text">{item.summary}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                    <p className="text-xs text-text-muted">
                      {item.followUpDate
                        ? item.followUpDone
                          ? t("interactions.followUpDoneTag")
                          : t("interactions.followUpTag", { date: formatDate(item.followUpDate) })
                        : null}
                    </p>
                    <Button variant="link" onClick={() => onEdit(item)}>
                      {t("interactions.editAction")}
                      <span className="sr-only">
                        {" "}
                        — {clientNames[item.clientId]} {time}
                      </span>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
