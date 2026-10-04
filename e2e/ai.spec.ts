import { test, expect } from "@playwright/test";
import { freshStart } from "./helpers";

test.describe("Flujo 3 · HU-12.2 Preguntar al asistente IA", () => {
  test("shows a loading state, then a simulated answer with real data", async ({ page }) => {
    await freshStart(page, "/ai");

    const question = page.getByLabel("Tu pregunta");
    await question.fill("¿Qué facturas están vencidas?");
    await question.press("Enter");

    // The mock waits ~1.5 s: the loading state must be announced meanwhile.
    await expect(page.getByRole("status").filter({ hasText: "ClientBrain está pensando…" })).toBeVisible();

    // The chat's live region is the one that receives the question.
    const chat = page.locator('[aria-live="polite"]').filter({ hasText: "¿Qué facturas están vencidas?" });
    await expect(chat.getByText(/FAC-1042 de Wayne Enterprises/)).toBeVisible({ timeout: 5000 });
    await expect(chat.getByText("Respuesta simulada").last()).toBeVisible();
    await expect(page.getByText("ClientBrain está pensando…")).toHaveCount(0);
  });
});
