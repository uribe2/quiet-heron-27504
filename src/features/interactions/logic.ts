import { toISODate } from "@/lib/dates";
import type { Interaction, InteractionChannel, Sentiment } from "./types";

export interface InteractionFilters {
  clientId?: string;
  channel?: InteractionChannel;
  sentiment?: Sentiment;
}

export function filterInteractions(list: Interaction[], filters: InteractionFilters): Interaction[] {
  return list.filter(
    (i) =>
      (!filters.clientId || i.clientId === filters.clientId) &&
      (!filters.channel || i.channel === filters.channel) &&
      (!filters.sentiment || i.sentiment === filters.sentiment),
  );
}

/** Newest first. */
export function sortInteractionsDesc(list: Interaction[]): Interaction[] {
  return [...list].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export interface InteractionDayGroup {
  day: string; // 'YYYY-MM-DD' (local day)
  items: Interaction[];
}

/** Groups by local day, days and items newest first. */
export function groupInteractionsByDay(list: Interaction[]): InteractionDayGroup[] {
  const groups = new Map<string, Interaction[]>();
  for (const item of sortInteractionsDesc(list)) {
    const day = toISODate(new Date(item.occurredAt));
    const bucket = groups.get(day);
    if (bucket) bucket.push(item);
    else groups.set(day, [item]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([day, items]) => ({ day, items }));
}

/** Pending follow-ups: date <= today and not done, sorted by date ascending. */
export function getDueFollowUps(interactions: Interaction[], today: string): Interaction[] {
  return interactions
    .filter((i) => Boolean(i.followUpDate) && !i.followUpDone && (i.followUpDate as string) <= today)
    .sort((a, b) => (a.followUpDate as string).localeCompare(b.followUpDate as string));
}

/** All not-done follow-ups (any date), sorted by date ascending. */
export function getPendingFollowUps(interactions: Interaction[]): Interaction[] {
  return interactions
    .filter((i) => Boolean(i.followUpDate) && !i.followUpDone)
    .sort((a, b) => (a.followUpDate as string).localeCompare(b.followUpDate as string));
}

export function isFollowUpOverdue(interaction: Interaction, today: string): boolean {
  return Boolean(interaction.followUpDate) && !interaction.followUpDone && (interaction.followUpDate as string) < today;
}

/** A reschedule date is valid when it is not before the interaction's date. */
export function isValidRescheduleDate(interaction: Interaction, date: string): boolean {
  if (!date) return false;
  return date >= toISODate(new Date(interaction.occurredAt));
}
