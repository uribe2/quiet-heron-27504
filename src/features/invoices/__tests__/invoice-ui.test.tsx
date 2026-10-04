import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { InvoiceForm } from "../components/invoice-form";
import { InvoiceTable } from "../components/invoice-table";
import { renderWithProviders } from "@/test/render-with-providers";
import type { Invoice } from "../types";
import type { Client } from "@/features/clients/types";

const clients = [{ id: "c-acme", name: "Acme Corp" }] as Client[];

const invoice: Invoice = {
  id: "i-x",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  number: "FAC-0099",
  clientId: "c-acme",
  issueDate: "2026-01-01",
  dueDate: "2026-01-31",
  items: [{ id: "li", description: "Work", quantity: 1, unitPriceCents: 10000 }],
  taxRate: 0,
  status: "sent",
};

describe("InvoiceForm errors", () => {
  it("shows an error for negative unit price and out-of-range tax", async () => {
    renderWithProviders(<InvoiceForm invoice={{ ...invoice, status: "draft" }} clients={clients} onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Precio unitario"), { target: { value: "-5" } });
    fireEvent.change(screen.getByLabelText("Impuesto (%)"), { target: { value: "101" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(screen.getByText("Usa un número mayor o igual a 0.")).toBeTruthy());
    expect(screen.getByText("Usa un porcentaje entre 0 y 100.")).toBeTruthy();
  });
});

describe("InvoiceTable cancel action (HU-08.4)", () => {
  it("explains the cancel action accessibly", () => {
    renderWithProviders(<InvoiceTable invoices={[invoice]} onDelete={vi.fn()} onCancel={vi.fn()} />);
    const btn = screen.getByRole("button", { name: "Anular FAC-0099" });
    const helpId = btn.getAttribute("aria-describedby")!;
    expect(document.getElementById(helpId)?.textContent).toContain("no se puede deshacer");
    expect(btn.getAttribute("title")).toContain("no se puede deshacer");
  });
});
