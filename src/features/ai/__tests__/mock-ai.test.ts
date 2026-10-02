import { describe, it, expect } from "vitest";
import { createSeedData } from "@/lib/seed";
import { answerQuestion, draftFollowUp, generateSummary } from "../mock-ai";

describe("HU-12.1 Ver síntesis ejecutiva y salud de clientes", () => {
  it("generates a summary with real data in Spanish", async () => {
    const data = createSeedData();
    const text = await generateSummary(data, 7, "es", 0);
    expect(text).toContain("Alex Rivera");
    expect(text).toContain("7 días");
    expect(text).toContain("Wayne Enterprises");
  });

  it("generates the summary in English", async () => {
    const text = await generateSummary(createSeedData(), 30, "en", 0);
    expect(text).toContain("last 30 days");
    expect(text).toContain("Accounts receivable");
  });

  it("waits for the given delay before resolving", async () => {
    const start = Date.now();
    await generateSummary(createSeedData(), 7, "es", 30);
    expect(Date.now() - start).toBeGreaterThanOrEqual(25);
  });
});

describe("HU-12.2 Preguntar a ClientBrain", () => {
  it("answers overdue invoices with real data (es)", async () => {
    const text = await answerQuestion("¿Qué facturas están vencidas?", createSeedData(), "es", 0);
    expect(text).toContain("FAC-1042");
    expect(text).toContain("Wayne Enterprises");
  });

  it("answers overdue invoices with real data (en)", async () => {
    const text = await answerQuestion("Which invoices are overdue?", createSeedData(), "en", 0);
    expect(text).toContain("FAC-1042");
    expect(text).toContain("overdue");
  });

  it("answers upcoming deliverables, income and follow-ups", async () => {
    const data = createSeedData();
    expect(await answerQuestion("¿Qué entregables vencen pronto?", data, "es", 0)).toContain("Wireframes de inicio");
    expect(await answerQuestion("How much income this month?", data, "en", 0)).toMatch(/collected/);
    expect(await answerQuestion("seguimientos pendientes", data, "es", 0)).toMatch(/Seguimientos pendientes|No tienes seguimientos/);
  });

  it("answers how a client is doing by matching the client name", async () => {
    const text = await answerQuestion("How is Wayne Enterprises doing?", createSeedData(), "en", 0);
    expect(text).toContain("Wayne Enterprises");
    expect(text).toMatch(/\d+%/);
  });

  it("falls back to a friendly list of supported topics", async () => {
    const text = await answerQuestion("tell me a joke", createSeedData(), "en", 0);
    expect(text).toContain("overdue invoices");
  });
});

describe("HU-12.3 Generar borradores de seguimiento", () => {
  const input = { clientId: "c-wayne", channel: "email" as const, tone: "formal" as const, goal: "recordar el pago de FAC-1042" };

  it("fills the draft with contact, goal and user data", async () => {
    const text = await draftFollowUp(input, createSeedData(), "es", 0);
    expect(text).toContain("Lucius Fox");
    expect(text).toContain("recordar el pago de FAC-1042.");
    expect(text).toContain("Alex Rivera");
    expect(text).toContain("Asunto");
  });

  it("changes the text by channel and tone, and by language", async () => {
    const data = createSeedData();
    const wa = await draftFollowUp({ ...input, channel: "whatsapp", tone: "friendly" }, data, "en", 0);
    expect(wa).toContain("Hi Lucius Fox!");
    expect(wa).not.toContain("Subject");
  });
});
