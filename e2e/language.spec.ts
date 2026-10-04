import { test, expect } from "@playwright/test";
import { freshStart, gotoPage } from "./helpers";

test.describe("Flujo 4 · i18n Cambio de idioma", () => {
  test("switches the whole UI to English and keeps it after reload", async ({ page }) => {
    await freshStart(page, "/invoices");
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Clientes" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");

    await page.getByRole("group", { name: "Idioma" }).getByRole("button", { name: /en/i }).click();

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1, name: "Invoices" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Clients" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Projects" })).toBeVisible();
    // Money follows the English locale: US$ 1,234.56 rather than US$ 1.234,56
    await expect(page.getByText(/\$\s?\d{1,3}(,\d{3})*\.\d{2}/).first()).toBeVisible();

    await page.reload();
    await gotoPage(page, "/clients");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1, name: "Clients" })).toBeVisible();
  });
});
