import { expect, type Page } from "@playwright/test";

/** Starts from fresh seed data (relative to today) without wiping storage on later navigations. */
export async function freshStart(page: Page, path = "/") {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await gotoPage(page, path);
}

/** Navigates and waits until the page has hydrated from localStorage (the shell shows a skeleton before). */
export async function gotoPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

/** The topmost open native <dialog> (drawers and confirm dialogs coexist in the DOM). */
export function openDialog(page: Page) {
  return page.locator("dialog[open]").last();
}

export function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
