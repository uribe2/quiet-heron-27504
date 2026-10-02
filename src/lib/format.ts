import type { ISODate, ISODateTime } from "./types";

export function formatCents(
  cents: number,
  currency: string,
  locale: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatDateISO(
  date: ISODate | ISODateTime,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = date.length > 10 ? new Date(date) : new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat(
    locale,
    options ?? { day: "2-digit", month: "short", year: "numeric" },
  ).format(d);
}

export function centsFromAmount(amount: number): number {
  return Math.round(amount * 100);
}

export function amountFromCents(cents: number): number {
  return cents / 100;
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}
