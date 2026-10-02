import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act, screen, fireEvent } from "@testing-library/react";
import { usePipeline } from "../use-pipeline";
import { useData } from "@/context/data-context";
import { useQuotes } from "@/features/quotes/use-quotes";
import { ProvidersWrapper } from "@/test/render-with-providers";
import { buildOpportunitySchema, type OpportunityFormValues } from "../schema";
import { getColumns, columnTotals, moveToStage, nextPosition } from "../logic";
import { OPPORTUNITY_STAGES } from "../types";
import { addDays, getToday, setMockToday } from "@/lib/dates";

afterEach(() => setMockToday(null));

function useAll() {
  return { pipeline: usePipeline(), data: useData(), quotes: useQuotes() };
}

const baseValues: OpportunityFormValues = {
  clientId: "c-acme",
  title: "Nueva oportunidad",
  value: 1250.5,
  stage: "quote",
  expectedCloseDate: "",
  notes: "",
};

describe("HU-03.1 Ver tablero de oportunidades", () => {
  it("groups open opportunities into the five stages by position", () => {
    const { result } = renderHook(() => usePipeline(), { wrapper: ProvidersWrapper });
    const columns = getColumns(result.current.opportunities);
    expect(Object.keys(columns)).toEqual(OPPORTUNITY_STAGES);
    expect(columns.contact.map((o) => o.id)).toEqual(["o-1", "o-2", "o-8"]);
    expect(columns.project.map((o) => o.id)).toEqual(["o-4", "o-5"]);
  });

  it("computes count and total value per column", () => {
    const { result } = renderHook(() => usePipeline(), { wrapper: ProvidersWrapper });
    const totals = columnTotals(getColumns(result.current.opportunities));
    expect(totals.contact).toEqual({ count: 3, totalCents: 150000 + 120000 + 200000 });
    expect(totals.collection).toEqual({ count: 1, totalCents: 90000 });
  });

  it("filters by client", () => {
    const { result } = renderHook(() => usePipeline(), { wrapper: ProvidersWrapper });
    const columns = getColumns(result.current.opportunities, { clientId: "c-techcorp" });
    const ids = Object.values(columns).flat().map((o) => o.id);
    expect(ids).toEqual(["o-3"]);
  });

  it("hides won and lost by default and shows them on toggle", () => {
    const { result } = renderHook(() => usePipeline(), { wrapper: ProvidersWrapper });
    const hidden = Object.values(getColumns(result.current.opportunities)).flat().map((o) => o.id);
    expect(hidden).not.toContain("o-9");
    expect(hidden).not.toContain("o-10");
    const shown = Object.values(getColumns(result.current.opportunities, { showClosed: true })).flat().map((o) => o.id);
    expect(shown).toEqual(expect.arrayContaining(["o-9", "o-10"]));
  });
});

describe("HU-03.2 Crear y editar oportunidad", () => {
  it("creates at the end of its column with value in cents", () => {
    const { result } = renderHook(() => useAll(), { wrapper: ProvidersWrapper });
    let created!: ReturnType<typeof result.current.pipeline.createOpportunity>;
    act(() => {
      created = result.current.pipeline.createOpportunity(baseValues);
    });
    expect(created).toMatchObject({ stage: "quote", status: "open", estimatedValueCents: 125050, position: 1 });
    expect(result.current.data.data.opportunities.some((o) => o.id === created.id)).toBe(true);
  });

  it("rejects negative value and past expected date on create only", () => {
    setMockToday("2026-06-10");
    const create = buildOpportunitySchema(true);
    expect(create.safeParse({ ...baseValues, value: -1 }).success).toBe(false);
    expect(create.safeParse({ ...baseValues, expectedCloseDate: "2026-06-09" }).success).toBe(false);
    expect(create.safeParse({ ...baseValues, expectedCloseDate: "2026-06-10" }).success).toBe(true);
    expect(buildOpportunitySchema(false).safeParse({ ...baseValues, expectedCloseDate: "2026-06-09" }).success).toBe(true);
  });

  it("updates fields and moves to the end when the stage changes", () => {
    const { result } = renderHook(() => usePipeline(), { wrapper: ProvidersWrapper });
    act(() => {
      result.current.updateOpportunity("o-1", { ...baseValues, title: "Editada", stage: "project", value: 10 });
    });
    const updated = result.current.opportunities.find((o) => o.id === "o-1")!;
    expect(updated).toMatchObject({ title: "Editada", stage: "project", estimatedValueCents: 1000, position: 2 });
  });

  it("requires a client and a title", () => {
    const schema = buildOpportunitySchema(true);
    expect(schema.safeParse({ ...baseValues, clientId: "" }).success).toBe(false);
    expect(schema.safeParse({ ...baseValues, title: " " }).success).toBe(false);
    expect(schema.safeParse({ ...baseValues, expectedCloseDate: addDays(getToday(), 3) }).success).toBe(true);
  });
});

describe("HU-03.3 Mover oportunidad entre etapas", () => {
  it("moveToStage and nextPosition place the card at the end of the column", () => {
    const { result } = renderHook(() => usePipeline(), { wrapper: ProvidersWrapper });
    const opps = result.current.opportunities;
    expect(nextPosition(opps, "contact")).toBe(3);
    expect(nextPosition(opps, "delivery")).toBe(1);
    expect(moveToStage(opps, "o-1", "project")).toEqual({ stage: "project", position: 2 });
  });

  it("moves a card and updates the totals of both columns", () => {
    const { result } = renderHook(() => usePipeline(), { wrapper: ProvidersWrapper });
    const o1 = result.current.opportunities.find((o) => o.id === "o-1")!;
    act(() => result.current.moveOpportunity(o1, "quote"));
    const totals = columnTotals(getColumns(result.current.opportunities));
    expect(totals.contact.count).toBe(2);
    expect(totals.quote).toEqual({ count: 2, totalCents: 350000 + 150000 });
    expect(getColumns(result.current.opportunities).quote.at(-1)?.id).toBe("o-1");
  });

  it("shows a toast and Deshacer restores stage and position", () => {
    const { result } = renderHook(() => usePipeline(), { wrapper: ProvidersWrapper });
    const o1 = result.current.opportunities.find((o) => o.id === "o-1")!;
    act(() => result.current.moveOpportunity(o1, "delivery"));
    fireEvent.click(screen.getByText("Deshacer"));
    const restored = result.current.opportunities.find((o) => o.id === "o-1")!;
    expect(restored).toMatchObject({ stage: "contact", position: 0 });
  });

  it("creating a quote from an opportunity links it and moves it to quote", () => {
    const { result } = renderHook(() => useAll(), { wrapper: ProvidersWrapper });
    const o1 = result.current.pipeline.opportunities.find((o) => o.id === "o-1")!;
    let quoteId = "";
    act(() => {
      quoteId = result.current.quotes.createQuoteFromOpportunity(o1, {
        clientId: "",
        title: o1.title,
        items: [{ id: "li-x", description: "Item", quantity: 1, unitPriceCents: 1000 }],
        taxRate: 0,
        paymentTerms: "100%",
        validUntil: addDays(getToday(), 10),
      }).id;
    });
    const after = result.current.pipeline.opportunities.find((o) => o.id === "o-1")!;
    expect(after).toMatchObject({ stage: "quote", quoteId });
  });
});

describe("HU-03.4 Cerrar y eliminar oportunidad", () => {
  it("marks won and removes it from the default board", () => {
    const { result } = renderHook(() => usePipeline(), { wrapper: ProvidersWrapper });
    const o2 = result.current.opportunities.find((o) => o.id === "o-2")!;
    act(() => result.current.markWon(o2));
    expect(result.current.opportunities.find((o) => o.id === "o-2")?.status).toBe("won");
    const ids = Object.values(getColumns(result.current.opportunities)).flat().map((o) => o.id);
    expect(ids).not.toContain("o-2");
  });

  it("marks lost with a reason and reopens at its last stage", () => {
    const { result } = renderHook(() => usePipeline(), { wrapper: ProvidersWrapper });
    const o3 = result.current.opportunities.find((o) => o.id === "o-3")!;
    act(() => result.current.markLost(o3, "timing"));
    const lost = result.current.opportunities.find((o) => o.id === "o-3")!;
    expect(lost).toMatchObject({ status: "lost", lostReason: "timing", stage: "quote" });
    act(() => result.current.reopen(lost));
    const reopened = result.current.opportunities.find((o) => o.id === "o-3")!;
    expect(reopened).toMatchObject({ status: "open", stage: "quote" });
    expect(reopened.lostReason).toBeUndefined();
    expect(getColumns(result.current.opportunities).quote.map((o) => o.id)).toContain("o-3");
  });

  it("deletes with Deshacer restoring at the original index", () => {
    const { result } = renderHook(() => useAll(), { wrapper: ProvidersWrapper });
    const before = result.current.data.data.opportunities.map((o) => o.id);
    const o4 = result.current.pipeline.opportunities.find((o) => o.id === "o-4")!;
    act(() => result.current.pipeline.deleteOpportunity(o4));
    expect(result.current.data.data.opportunities.some((o) => o.id === "o-4")).toBe(false);
    fireEvent.click(screen.getByText("Deshacer"));
    expect(result.current.data.data.opportunities.map((o) => o.id)).toEqual(before);
  });
});
