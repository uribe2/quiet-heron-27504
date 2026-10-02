import type { ISODate, ISODateTime } from "./types";

let mockToday: ISODate | null = null;

/** 'YYYY-MM-DD' for the current day. Mockable in tests via setMockToday(). */
export function getToday(): ISODate {
  if (mockToday) return mockToday;
  return toISODate(new Date());
}

export function getNowISO(): ISODateTime {
  return new Date().toISOString();
}

export function setMockToday(date: ISODate | null): void {
  mockToday = date;
}

export function toISODate(date: Date): ISODate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: ISODate, days: number): ISODate {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toISODate(dt);
}

export function diffInDays(a: ISODate, b: ISODate): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const da = new Date(ay, am - 1, ad).getTime();
  const db = new Date(by, bm - 1, bd).getTime();
  return Math.round((da - db) / (1000 * 60 * 60 * 24));
}

export function isBeforeToday(date: ISODate): boolean {
  return date < getToday();
}

export function isFutureDateTime(dateTime: ISODateTime): boolean {
  return new Date(dateTime).getTime() > Date.now();
}

export function dateOnly(dateTime: ISODateTime): ISODate {
  return dateTime.slice(0, 10);
}
