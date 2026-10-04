import { describe, it, expect, beforeAll, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProvidersWrapper, renderWithProviders } from "@/test/render-with-providers";
import { ProjectForm } from "../components/project-form";
import { ProjectDrawer } from "../components/project-drawer";
import { ProjectDocuments } from "../components/project-documents";
import { projectFormSchema } from "../schema";
import { useClients } from "@/features/clients/use-clients";
import type { ReactNode } from "react";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

function WithClients({ children }: { children: (c: ReturnType<typeof useClients>["clients"]) => ReactNode }) {
  const { clients } = useClients();
  return <>{children(clients)}</>;
}

describe("HU-04.2 Validación específica del formulario de proyectos", () => {
  it("schema emits specific messages per field", () => {
    const r = projectFormSchema.safeParse({ clientId: "", name: "", billingType: "fixed", startDate: "", dueDate: "", budgetCents: -5 });
    expect(r.success).toBe(false);
    const byPath = Object.fromEntries((r.error?.issues ?? []).reverse().map((i) => [i.path.join("."), i.message]));
    expect(byPath.clientId).toBe("required");
    expect(byPath.name).toBe("required");
    expect(byPath.startDate).toBe("required");
    expect(byPath.dueDate).toBe("required");
    expect(byPath.budgetCents).toBe("mustBeNonNegative");
  });

  it("shows required errors for client and start date, and endAfterStart", async () => {
    renderWithProviders(<WithClients>{(clients) => <ProjectForm clients={clients} onSubmit={vi.fn()} />}</WithClients>);
    fireEvent.submit(document.getElementById("project-form")!);
    await waitFor(() => expect(screen.getAllByText("Este campo es obligatorio.").length).toBeGreaterThanOrEqual(3));
  });

  it("shows endAfterStart when due date precedes start", async () => {
    renderWithProviders(<WithClients>{(clients) => <ProjectForm clients={clients} onSubmit={vi.fn()} />}</WithClients>);
    const dates = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dates[0], { target: { value: "2026-05-10" } });
    fireEvent.change(dates[1], { target: { value: "2026-05-01" } });
    fireEvent.submit(document.getElementById("project-form")!);
    expect(await screen.findByText("La fecha final debe ser posterior a la inicial.")).toBeTruthy();
  });
});

describe("HU-11.4 Documentos en el detalle del proyecto", () => {
  it("lists documents linked to the project", () => {
    renderWithProviders(<ProjectDocuments projectId="p-1" />);
    expect(screen.getByText(/Contrato Acme/)).toBeTruthy();
    expect(screen.queryByText(/Brief StartupX/)).toBeNull();
  });

  it("shows an empty state when the project has no documents", () => {
    renderWithProviders(<ProjectDocuments projectId="p-none" />);
    expect(screen.getByText("Sin documentos vinculados a este proyecto.")).toBeTruthy();
  });
});

describe("Drawer de proyectos: estado dirty", () => {
  it("does not ask to discard after the drawer was closed with edits (e.g. after saving)", () => {
    const onClose = vi.fn();
    function Harness({ open }: { open: boolean }) {
      return (
        <WithClients>
          {(clients) => <ProjectDrawer isOpen={open} onClose={onClose} clients={clients} onSubmit={vi.fn()} />}
        </WithClients>
      );
    }
    const { rerender } = render(<Harness open />, { wrapper: ProvidersWrapper });
    const input = document.querySelector('input:not([type])') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Cambio" } });
    rerender(<Harness open={false} />);
    rerender(<Harness open />);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar", hidden: true }));
    expect(onClose).toHaveBeenCalled();
  });
});
