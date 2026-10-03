"use client";

import { Video, Phone, MapPin, Clock, CalendarCheck, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import type { Meeting } from "../types";
import { groupMeetingsByDay, isToday } from "../logic";
import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";

const statusTone = { scheduled: "accent", done: "success", cancelled: "neutral" } as const;
const statusIcon = { scheduled: CalendarCheck, done: CheckCircle2, cancelled: XCircle } as const;
const modeIcon = { in_person: MapPin, video: Video, call: Phone } as const;

export function MeetingList({ meetings, onOpen }: { meetings: Meeting[]; onOpen: (meeting: Meeting) => void }) {
  const { data } = useData();
  const { t, formatDate } = useTranslation();
  const grouped = groupMeetingsByDay(meetings);

  return (
    <div className="flex flex-col gap-8">
      {Array.from(grouped.entries()).map(([day, dayMeetings]) => {
        const today = dayMeetings.some(isToday);
        return (
          <section key={day} aria-label={formatDate(day)}>
            <h2 className="mb-3 flex flex-wrap items-center gap-2 text-base font-semibold text-text">
              <span
                className={`h-2 w-2 rounded-full ${today ? "bg-accent" : "bg-border-strong"}`}
                aria-hidden="true"
              />
              {today ? <span>{t("meetings.todayLabel")}</span> : null}
              <span className={today ? "text-sm font-normal text-text-muted" : ""}>{formatDate(day)}</span>
            </h2>
            <ul className="flex flex-col gap-3">
              {dayMeetings.map((meeting) => {
                const client = data.clients.find((c) => c.id === meeting.clientId);
                const Icon = modeIcon[meeting.mode];
                const StatusIcon = statusIcon[meeting.status];
                const time = new Date(meeting.startsAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
                return (
                  <li key={meeting.id}>
                    <Card className="p-0 transition-shadow hover:shadow-[var(--shadow-level-1)]">
                      <button
                        type="button"
                        onClick={() => onOpen(meeting)}
                        className="flex w-full flex-col gap-4 rounded-xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:p-5"
                      >
                        <div className="flex w-fit shrink-0 flex-col gap-0.5 rounded-lg bg-surface-muted px-3 py-2 sm:w-32">
                          <span className="flex items-center gap-1.5 text-base font-semibold text-link">
                            <Clock className="h-4 w-4" aria-hidden="true" />
                            {time}
                          </span>
                          <span className="text-xs text-text-muted">{meeting.durationMinutes} min</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <StatusBadge
                              label={t(`meetings.status${capitalize(meeting.status)}`)}
                              tone={statusTone[meeting.status]}
                              icon={<StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />}
                            />
                            {client ? <span className="text-sm font-medium text-text">{client.name}</span> : null}
                          </div>
                          <p className="text-base font-semibold text-text">{meeting.title}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
                            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>{t(`meetings.mode${capitalize(meeting.mode)}`)}</span>
                            {meeting.locationOrLink ? (
                              <span className="min-w-0 truncate">· {meeting.locationOrLink}</span>
                            ) : null}
                          </p>
                        </div>
                        <ChevronRight className="hidden h-5 w-5 shrink-0 text-text-muted sm:block" aria-hidden="true" />
                      </button>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_(.)/g, (_, c: string) => c.toUpperCase());
}
