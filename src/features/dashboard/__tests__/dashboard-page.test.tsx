import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "@/test/render-with-providers";
import { DashboardPage } from "../components/dashboard-page";

describe("Dashboard — resumen general", () => {
  it("renders a single h1 with the overview heading", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Resumen general" })).toBeInTheDocument();
  });

  it("shows at most 3 alerts in the strip, each with an action link", () => {
    renderWithProviders(<DashboardPage />);
    const items = screen.getAllByTestId("dashboard-alert");
    expect(items).toHaveLength(3);
    for (const li of items) expect(within(li).getByRole("link")).toBeInTheDocument();
    expect(items[0]).toHaveTextContent("FAC-1042");
    expect(within(items[0]).getByRole("link", { name: "Cobrar" })).toHaveAttribute("href", "/invoices/inv-1042");
  });

  it("shows the KPI labels", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("Ingresos del mes")).toBeInTheDocument();
    expect(screen.getByText("Cuentas por cobrar")).toBeInTheDocument();
    expect(screen.getByText("Horas facturables esta semana")).toBeInTheDocument();
  });

  it("shows projects, AI action and pipeline preview with links", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByRole("link", { name: "Ver tablero completo" })).toHaveAttribute("href", "/pipeline");
    expect(screen.getByRole("link", { name: "Ver proyectos" })).toHaveAttribute("href", "/projects");
    expect(screen.getByRole("link", { name: "Abrir Resumen IA" })).toHaveAttribute("href", "/ai");
    expect(screen.getAllByRole("progressbar").length).toBeLessThanOrEqual(2);
  });
});
