import { test, expect } from "@playwright/test";
import { freshStart, gotoPage, openDialog } from "./helpers";

test.describe("Flujo 2 · HU-06.1 / HU-08.2 / HU-09.1 Cronómetro → factura → pago", () => {
  test("times work, bills the hours and records a full payment", async ({ page }) => {
    const description = "Sesión E2E";
    await freshStart(page, "/time");

    // HU-06.1 — start the timer on an hourly project.
    await page.getByRole("combobox", { name: "Proyecto" }).first().selectOption({ label: "Rediseño app móvil StartupX" });
    await page.getByLabel("Descripción").first().fill(description);
    await page.getByRole("button", { name: "Iniciar" }).click();

    const header = page.getByRole("banner");
    await expect(header.getByRole("button", { name: /^Detener/ })).toBeVisible();

    // The timer lives in the data context: it survives navigation and a full reload.
    await gotoPage(page, "/clients");
    await page.reload();
    await expect(header.getByText("Rediseño app móvil StartupX")).toBeVisible();
    await expect(header.getByText(/^\d{2}:\d{2}:\d{2}$/)).toBeVisible();

    await header.getByRole("button", { name: /^Detener/ }).click();
    await expect(page.getByText("Registro de tiempo guardado.")).toBeVisible();
    await expect(header.getByRole("button", { name: /^Detener/ })).toHaveCount(0);

    // HU-08.2 — bill the project's unbilled hours (includes the 1-minute minimum entry).
    await gotoPage(page, "/projects/p-4");
    await page.getByRole("button", { name: "Facturar horas" }).click();
    const billDialog = openDialog(page);
    await expect(billDialog.getByText(description, { exact: false })).toBeVisible();
    await billDialog.getByRole("button", { name: "Crear factura" }).click();

    await page.waitForURL(/\/invoices\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("FAC-");
    await expect(page.getByRole("main").getByText(description, { exact: false })).toBeVisible();

    // HU-08.3 — send it, then HU-09.1 — pay the whole balance.
    await page.getByRole("button", { name: "Marcar como enviada" }).click();
    await expect(page.getByText("Factura marcada como enviada")).toBeVisible();

    await page.getByRole("button", { name: "Registrar pago" }).click();
    const paymentDrawer = openDialog(page);
    await expect(paymentDrawer.getByLabel("Monto")).not.toHaveValue("0");
    await paymentDrawer.getByRole("button", { name: "Guardar pago" }).click();
    await expect(page.getByText("Pago registrado.")).toBeVisible();
    await expect(page.getByRole("main").getByText("Pagada").first()).toBeVisible();

    // Billed entries become read-only in Time.
    await gotoPage(page, "/time");
    const entry = page.getByRole("listitem").filter({ hasText: description });
    await expect(entry).toContainText("Facturado");
  });
});
