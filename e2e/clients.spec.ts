import { test, expect } from "@playwright/test";
import { freshStart, openDialog } from "./helpers";

test.describe("Flujo 5 · HU-01.1 / HU-01.3 Clientes: validación, creación y deshacer", () => {
  test("validates, creates a client and undoes its archiving", async ({ page }) => {
    await freshStart(page, "/clients");

    await page.getByRole("button", { name: "+ Crear cliente" }).click();
    const drawer = openDialog(page);
    await drawer.getByRole("button", { name: "Guardar" }).click();
    await expect(drawer.getByText("Este campo es obligatorio.").first()).toBeVisible();

    await drawer.getByLabel("Nombre", { exact: false }).first().fill("Cliente E2E");
    await drawer.getByLabel("Correo", { exact: false }).first().fill("no-es-correo");
    await drawer.getByRole("button", { name: "Guardar" }).click();
    await expect(drawer.getByText("Usa un correo válido", { exact: false })).toBeVisible();

    await drawer.getByLabel("Correo", { exact: false }).first().fill("e2e@ejemplo.com");
    await drawer.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Cliente guardado.")).toBeVisible();
    // Saving must not trigger the "discard changes?" prompt.
    await expect(page.locator("dialog[open]")).toHaveCount(0);

    const row = page.getByRole("row").filter({ hasText: "Cliente E2E" });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: /Archivar/ }).click();
    await page.getByRole("button", { name: "Deshacer" }).click();
    await expect(page.getByRole("row").filter({ hasText: "Cliente E2E" })).not.toContainText("Archivado");
  });
});
