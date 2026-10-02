import { dateOnly, getToday } from "@/lib/dates";
import type { Meeting, MeetingStatus } from "./types";

export function isUpcoming(meeting: Meeting, nowISO: string): boolean {
  return meeting.startsAt >= nowISO;
}

export function isToday(meeting: Meeting): boolean {
  return dateOnly(meeting.startsAt) === getToday();
}

export function groupMeetingsByDay(meetings: Meeting[]): Map<string, Meeting[]> {
  const map = new Map<string, Meeting[]>();
  for (const meeting of [...meetings].sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
    const day = dateOnly(meeting.startsAt);
    const list = map.get(day) ?? [];
    list.push(meeting);
    map.set(day, list);
  }
  return map;
}

export interface MeetingFilters {
  clientId?: string;
  status?: MeetingStatus | "all";
}

export function filterMeetings(meetings: Meeting[], filters: MeetingFilters): Meeting[] {
  return meetings.filter((m) => {
    if (filters.clientId && m.clientId !== filters.clientId) return false;
    if (filters.status && filters.status !== "all" && m.status !== filters.status) return false;
    return true;
  });
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function findOverlappingMeetings(
  meetings: Meeting[],
  startsAt: string,
  durationMinutes: number,
  excludeId?: string,
): Meeting[] {
  const start = new Date(startsAt).getTime();
  const end = start + durationMinutes * 60 * 1000;
  if (Number.isNaN(start)) return [];
  return meetings.filter((m) => {
    if (m.id === excludeId || m.status === "cancelled") return false;
    const mStart = new Date(m.startsAt).getTime();
    const mEnd = mStart + m.durationMinutes * 60 * 1000;
    return overlaps(start, end, mStart, mEnd);
  });
}
