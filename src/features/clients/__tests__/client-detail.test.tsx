import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render-with-providers";

const nav = vi.hoisted(() => ({ id: "c-acme" }));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: nav.id }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import ClientDetailPage from "@/app/clients/[id]/page";

describe("HU-01.3 Ver detalle y editar cliente — pestañas", () => {
  beforeEach(() => {
    nav.id = "c-acme";
    window.localStorage.clear();
  });

  it("shows the client health as text and percentage", () => {
    renderWithProviders(<ClientDetailPage />);
    expect(screen.getByText(/(Óptima|Atención|Crítica): \d+%/)).toBeInTheDocument();
  });

  it("activity tab lists interactions with channel and sentiment text and a register link", () => {
    renderWithProviders(<ClientDetailPage />);
    expect(screen.getByText("Confirmó los ajustes finales del sitio web.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Registrar comunicación" })).toHaveAttribute(
      "href",
      "/interactions?clientId=c-acme",
    );
    expect(screen.getAllByText(/Tono: Positivo/).length).toBeGreaterThan(0);
  });

  it("projects tab shows project link, status and progress", async () => {
    renderWithProviders(<ClientDetailPage />);
    await userEvent.click(screen.getByRole("tab", { name: "Proyectos" }));
    expect(screen.getByRole("link", { name: "Rediseño web Acme" })).toHaveAttribute("href", "/projects/p-1");
    expect(screen.getAllByText("Activo").length).toBeGreaterThan(1);
    expect(screen.getByText(/Progreso/)).toBeInTheDocument();
  });

  it("quotes & invoices tab shows the invoice with derived status, total and balance", async () => {
    renderWithProviders(<ClientDetailPage />);
    await userEvent.click(screen.getByRole("tab", { name: "Cotizaciones y facturas" }));
    expect(screen.getByRole("link", { name: "FAC-1041" })).toHaveAttribute("href", "/invoices/inv-1041");
    expect(screen.getByText("Pagada")).toBeInTheDocument();
    expect(screen.getByText(/Saldo:/)).toBeInTheDocument();
  });

  it("quotes tab shows number, title and status for a client with quotes", async () => {
    nav.id = "c-techcorp";
    renderWithProviders(<ClientDetailPage />);
    await userEvent.click(screen.getByRole("tab", { name: "Cotizaciones y facturas" }));
    expect(screen.getAllByText(/COT-\d{4}-\d{3}/).length).toBeGreaterThan(1);
    expect(screen.getByText("Aceptada")).toBeInTheDocument();
  });

  it("documents tab shows kind as text and file name for a file document", async () => {
    renderWithProviders(<ClientDetailPage />);
    await userEvent.click(screen.getByRole("tab", { name: "Documentos" }));
    expect(screen.getByText("Contrato Acme")).toBeInTheDocument();
    expect(screen.getByText("Contrato")).toBeInTheDocument();
  });

  it("opens link documents in a new tab with an sr-only hint", async () => {
    nav.id = "c-techcorp";
    renderWithProviders(<ClientDetailPage />);
    await userEvent.click(screen.getByRole("tab", { name: "Documentos" }));
    const link = screen.getByRole("link", { name: /Propuesta TechCorp/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("shows the not-found state for an unknown client", () => {
    nav.id = "nope";
    renderWithProviders(<ClientDetailPage />);
    expect(screen.getByText("Cliente no encontrado")).toBeInTheDocument();
  });
});
