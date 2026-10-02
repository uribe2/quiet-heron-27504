import type { Project } from "@/features/projects/types";
import { addDays, getToday, toISODate } from "@/lib/dates";
import type { ID, ISODate, ISODateTime } from "@/lib/types";
import type { TimeEntry } from "./types";

export const MAX_ENTRY_MINUTES = 1440;

/** Whole minutes between two ISO datetimes (rounded to nearest minute). */
export function durationMinutes(start: ISODateTime, end: ISODateTime): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

/** Local date (YYYY-MM-DD) of an entry's start. */
export function entryDate(entry: Pick<TimeEntry, "startedAt">): ISODate {
  return toISODate(new Date(entry.startedAt));
}

/** Local HH:mm of an ISO datetime. */
export function toTimeInput(iso: ISODateTime): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Combine a local date and an HH:mm time into an ISO datetime. */
export function combineDateTime(date: ISODate, time: string): ISODateTime {
  return new Date(`${date}T${time}:00`).toISOString();
}

export interface ManualEntryInput {
  date: ISODate;
  startTime: string;
  endTime: string;
}

export type ManualEntryError = "required" | "endAfterStart" | "dateNotFuture" | "maxDuration";

/** Returns an error code or null when the manual entry is valid. */
export function validateManualEntry(
  input: ManualEntryInput,
  now: Date = new Date(),
): ManualEntryError | null {
  if (!input.date || !input.startTime || !input.endTime) return "required";
  const start = combineDateTime(input.date, input.startTime);
  const end = combineDateTime(input.date, input.endTime);
  const minutes = durationMinutes(start, end);
  if (minutes <= 0) return "endAfterStart";
  if (new Date(end).getTime() > now.getTime()) return "dateNotFuture";
  if (minutes > MAX_ENTRY_MINUTES) return "maxDuration";
  return null;
}

export interface DayGroup {
  date: ISODate;
  entries: TimeEntry[];
  totalMinutes: number;
}

/** Groups by local day, newest day first, newest entry first within each day. */
export function groupEntriesByDay(entries: TimeEntry[]): DayGroup[] {
  const map = new Map<ISODate, TimeEntry[]>();
  for (const entry of entries) {
    const key = entryDate(entry);
    const list = map.get(key);
    if (list) list.push(entry);
    else map.set(key, [entry]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([date, list]) => {
      const sorted = [...list].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
      return { date, entries: sorted, totalMinutes: sorted.reduce((s, e) => s + e.durationMinutes, 0) };
    });
}

/** Monday to Sunday range containing `today`. */
export function weekRange(today: ISODate = getToday()): { from: ISODate; to: ISODate } {
  const [y, m, d] = today.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  const from = addDays(today, -((dow + 6) % 7));
  return { from, to: addDays(from, 6) };
}

export type TriFilter = "all" | "yes" | "no";

export interface TimeFilters {
  projectId?: ID;
  billable?: TriFilter;
  invoiced?: TriFilter;
  from?: ISODate;
  to?: ISODate;
}

export function filterEntries(entries: TimeEntry[], filters: TimeFilters): TimeEntry[] {
  return entries.filter((e) => {
    if (filters.projectId && e.projectId !== filters.projectId) return false;
    if (filters.billable === "yes" && !e.billable) return false;
    if (filters.billable === "no" && e.billable) return false;
    if (filters.invoiced === "yes" && !e.invoiceId) return false;
    if (filters.invoiced === "no" && e.invoiceId) return false;
    const date = entryDate(e);
    if (filters.from && date < filters.from) return false;
    if (filters.to && date > filters.to) return false;
    return true;
  });
}

export interface TimeSummary {
  totalMinutes: number;
  billableMinutes: number;
  billableAmountCents: number;
}

/** Billable amount = hours x project hourly rate (hourly projects only). */
export function summarize(entries: TimeEntry[], projects: Project[]): TimeSummary {
  let totalMinutes = 0;
  let billableMinutes = 0;
  let billableAmountCents = 0;
  for (const e of entries) {
    totalMinutes += e.durationMinutes;
    if (!e.billable) continue;
    billableMinutes += e.durationMinutes;
    const project = projects.find((p) => p.id === e.projectId);
    if (project?.billingType === "hourly" && project.hourlyRateCents) {
      billableAmountCents += Math.round((e.durationMinutes / 60) * project.hourlyRateCents);
    }
  }
  return { totalMinutes, billableMinutes, billableAmountCents };
}

/** Billable hours logged in the Monday to Sunday week containing `today` (reusable by the dashboard). */
export function getBillableHoursThisWeek(entries: TimeEntry[], today: ISODate = getToday()): number {
  const { from, to } = weekRange(today);
  const { billableMinutes } = summarize(filterEntries(entries, { from, to }), []);
  return Math.round((billableMinutes / 60) * 100) / 100;
}

/** Label such as "2h 30m". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
