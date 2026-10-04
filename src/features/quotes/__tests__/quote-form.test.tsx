import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { QuoteForm } from "../components/quote-form";
import { renderWithProviders } from "@/test/render-with-providers";
import type { Quote } from "../types";
import type { Client } from "@/features/clients/types";

const clients = [{ id: "c-acme", name: "Acme Corp" }] as Client[];

function makeQuote(status: Quote["status"]): Quote {
  return {
    id: "q-x",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    number: "COT-2026-001",
    clientId: "c-acme",
    title: "Sitio web",
    items: [{ id: "li", description: "Diseño", quantity: 1, unitPriceCents: 10000 }],
    taxRate: 0,
    paymentTerms: "50/50",
    validUntil: "2026-12-31",
    status,
    history: [],
  };
}

describe("QuoteForm", () => {
  it("shows per-field errors on submit with empty required fields", async () => {
    renderWithProviders(<QuoteForm clients={clients} onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    await waitFor(() => expect(screen.getAllByText("Este campo es obligatorio.").length).toBeGreaterThanOrEqual(4));
  });

  it("shows errors for negative unit price and out-of-range tax", async () => {
    renderWithProviders(<QuoteForm clients={clients} quote={makeQuote("draft")} onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Precio unitario"), { target: { value: "-5" } });
    fireEvent.change(screen.getByLabelText("Impuesto"), { target: { value: "150" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    await waitFor(() => expect(screen.getByText("Usa un número mayor o igual a 0.")).toBeTruthy());
    expect(screen.getByText("Usa un porcentaje entre 0 y 100.")).toBeTruthy();
  });

  it("hides 'Guardar y enviar' when the quote is already sent, shows it for draft/new", () => {
    const { unmount } = renderWithProviders(<QuoteForm clients={clients} quote={makeQuote("sent")} onSubmit={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Guardar y enviar" })).toBeNull();
    expect(screen.getByRole("button", { name: "Guardar borrador" })).toBeTruthy();
    unmount();
    renderWithProviders(<QuoteForm clients={clients} onSubmit={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Guardar y enviar" })).toBeTruthy();
  });

  it("keeps totals inside the sticky footer", () => {
    renderWithProviders(<QuoteForm clients={clients} quote={makeQuote("draft")} onSubmit={vi.fn()} />);
    const footer = screen.getByTestId("quote-sticky-footer");
    expect(footer.className).toContain("sticky");
    expect(footer.textContent).toContain("Subtotal");
    expect(footer.textContent).toContain("Total");
  });
});
