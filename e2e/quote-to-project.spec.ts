import { test, expect } from "@playwright/test";
import { freshStart, gotoPage, isoDate, openDialog } from "./helpers";

test.describe("Flujo 1 · HU-07.2 / HU-07.3 / HU-07.4 Cotización → proyecto", () => {
  test("creates and sends a quote, accepts it and converts it into a project once", async ({ page }) => {
    const title = "Landing E2E";
    await freshStart(page, "/quotes");

    await page.getByRole("button", { name: "+ Crear cotización" }).click();
    let drawer = openDialog(page);
    await drawer.getByLabel("Cliente").selectOption({ label: "Acme Corp" });
    await drawer.getByLabel("Título").fill(title);
    await drawer.getByLabel("Descripción").first().fill("Diseño y desarrollo");
    await drawer.getByLabel("Cantidad").first().fill("2");
    await drawer.getByLabel("Precio unitario").first().fill("1500");
    await drawer.getByLabel("Condiciones de pago").fill("50% anticipo, 50% contra entrega");
    await drawer.getByLabel("Válida hasta").fill(isoDate(15));
    await drawer.getByRole("button", { name: "Guardar y enviar" }).click();
    await expect(page.locator("dialog[open]")).toHaveCount(0);

    const row = page.getByRole("row").filter({ hasText: title });
    await expect(row).toContainText("Enviada");

    await row.getByRole("button").first().click();
    drawer = openDialog(page);
    await drawer.getByRole("button", { name: "Marcar aceptada" }).click();
    await expect(page.getByText("Cotización marcada como aceptada.")).toBeVisible();
    await drawer.getByRole("button", { name: "Convertir en proyecto" }).click();
    await expect(page.getByText("Cotización convertida en proyecto.")).toBeVisible();

    // An accepted quote can be converted only once.
    await page.getByRole("row").filter({ hasText: title }).getByRole("button").first().click();
    await expect(openDialog(page).getByRole("button", { name: "Convertir en proyecto" })).toHaveCount(0);
    await page.keyboard.press("Escape");

    await gotoPage(page, "/projects");
    await expect(page.getByRole("main").getByText(title)).toBeVisible();
  });
});
