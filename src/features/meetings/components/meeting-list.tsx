"use client";

import { Video, Phone, MapPin } from "lucide-react";
import type { Meeting } from "../types";
import { groupMeetingsByDay, isToday } from "../logic";
import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";

const statusTone = { scheduled: "accent", done: "success", cancelled: "neutral" } as const;
const modeIcon = { in_person: MapPin, video: Video, call: Phone } as const;

export function MeetingList({ meetings, onOpen }: { meetings: Meeting[]; onOpen: (meeting: Meeting) => void }) {
  const { data } = useData();
  const { t, formatDate } = useTranslation();
  const grouped = groupMeetingsByDay(meetings);

  return (
    <div className="flex flex-col gap-6">
      {Array.from(grouped.entries()).map(([day, dayMeetings]) => (
        <div key={day}>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
            {formatDate(day)} {dayMeetings.some(isToday) ? `· ${t("meetings.todayLabel")}` : ""}
          </h2>
          <div className="flex flex-col gap-2">
            {dayMeetings.map((meeting) => {
              const client = data.clients.find((c) => c.id === meeting.clientId);
              const Icon = modeIcon[meeting.mode];
              const time = new Date(meeting.startsAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
              return (
                <Card key={meeting.id} className="p-4">
                  <button
                    type="button"
                    onClick={() => onOpen(meeting)}
                    className="flex w-full flex-wrap items-center justify-between gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    <div>
                      <p className="font-medium text-text">{meeting.title}</p>
                      <p className="text-sm text-text-muted">
                        {time} · {meeting.durationMinutes} min {client ? `· ${client.name}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-sm text-text-muted">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {t(`meetings.mode${capitalize(meeting.mode)}`)}
                      </span>
                      <StatusBadge label={t(`meetings.status${capitalize(meeting.status)}`)} tone={statusTone[meeting.status]} />
                    </div>
                  </button>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_(.)/g, (_, c: string) => c.toUpperCase());
}
