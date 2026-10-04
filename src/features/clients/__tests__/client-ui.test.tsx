import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProvidersWrapper, renderWithProviders } from "@/test/render-with-providers";
import { ClientForm } from "../components/client-form";
import { ClientDrawer } from "../components/client-drawer";
import { buildClientSchema } from "../schema";
import type { Client } from "../types";

const nav = vi.hoisted(() => ({ id: "c-acme" }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: nav.id }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import ClientDetailPage from "@/app/clients/[id]/page";
import ClientsPage from "@/app/clients/page";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

beforeEach(() => {
  nav.id = "c-acme";
  window.localStorage.clear();
});

const now = new Date().toISOString();
const existing: Client[] = [
  { id: "c-1", createdAt: now, updatedAt: now, name: "Acme Corp", type: "company", contacts: [], tags: [], status: "active" },
];

describe("schema emite claves i18n", () => {
  it("usa claves de validation en vez de textos de Zod", () => {
    const r = buildClientSchema(existing).safeParse({
      name: "A",
      type: "company",
      email: "x",
      website: "y",
      contacts: [
        { id: "1", name: "", email: "bad", isPrimary: false },
      ],
      tags: [],
    });
    expect(r.success).toBe(false);
    const msgs = Object.fromEntries((r.error?.issues ?? []).map((i) => [i.path.join("."), i.message]));
    expect(msgs["name"]).toBe("minLength");
    expect(msgs["email"]).toBe("invalidEmail");
    expect(msgs["website"]).toBe("invalidUrl");
    expect(msgs["contacts.0.name"]).toBe("required");
    expect(msgs["contacts"]).toBe("primaryContactRequired");
  });
});

describe("HU-01.2 mensajes traducidos en el formulario", () => {
  function renderForm() {
    return render(
      <ClientForm existingClients={existing} onSubmit={vi.fn()} />,
      { wrapper: ProvidersWrapper },
    );
  }

  it("muestra obligatorio, correo y URL inválidos en español", async () => {
    const { container } = renderForm();
    await userEvent.type(screen.getByLabelText(/Correo/, { selector: "input" }), "no-es-correo");
    await userEvent.type(screen.getByLabelText("Sitio web"), "no-url");
    container.querySelector("form")!.requestSubmit();
    expect(await screen.findByText("Este campo es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText(/Usa un correo válido/)).toBeInTheDocument();
    expect(screen.getByText(/Usa una URL válida/)).toBeInTheDocument();
  });

  it("muestra el error de nombre duplicado", async () => {
    const { container } = renderForm();
    await userEvent.type(screen.getByLabelText(/Nombre/, { selector: "input" }), "acme corp");
    container.querySelector("form")!.requestSubmit();
    expect(await screen.findByText("Ya existe un cliente activo con ese nombre.")).toBeInTheDocument();
  });

  it("muestra el error de contacto principal", async () => {
    const { container } = renderForm();
    await userEvent.type(screen.getAllByRole("textbox")[0], "Nuevo Cliente");
    await userEvent.click(screen.getByRole("button", { name: /Agregar contacto/ }));
    await userEvent.click(screen.getByRole("checkbox"));
    container.querySelector("form")!.requestSubmit();
    expect(await screen.findByText("Debe haber exactamente un contacto principal.")).toBeInTheDocument();
  });
});

describe("Descartar cambios no reaparece tras guardar", () => {
  function discardOpen() {
    return screen.getByText("¿Descartar cambios?").closest("dialog")!.hasAttribute("open");
  }

  it("resetea el estado sucio al cerrar el drawer", async () => {
    const onSubmit = vi.fn();
    function Harness({ open }: { open: boolean }) {
      return <ClientDrawer isOpen={open} onClose={() => {}} existingClients={existing} onSubmit={onSubmit} />;
    }
    const { rerender } = render(<Harness open />, { wrapper: ProvidersWrapper });
    await userEvent.type(screen.getAllByRole("textbox")[0], "Nuevo");
    // simula guardado exitoso: la página cierra el drawer directamente
    rerender(<Harness open={false} />);
    rerender(<Harness open />);
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(discardOpen()).toBe(false);
  });

  it("pregunta si hay cambios sin guardar", async () => {
    render(<ClientDrawer isOpen onClose={() => {}} existingClients={existing} onSubmit={vi.fn()} />, {
      wrapper: ProvidersWrapper,
    });
    await userEvent.type(screen.getAllByRole("textbox")[0], "Nuevo");
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(discardOpen()).toBe(true);
  });
});

describe("Toast al crear cliente", () => {
  it("muestra aviso de éxito al crear", async () => {
    renderWithProviders(<ClientsPage />);
    await userEvent.click(screen.getAllByRole("button", { name: "+ Crear cliente" })[0]);
    await userEvent.type(screen.getByLabelText(/^Nombre/, { selector: "input" }), "Cliente Nuevo SA");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(screen.getByText("Cliente guardado.")).toBeInTheDocument());
  });
});

describe("HU-01.3 ficha del cliente", () => {
  it("lista contactos y datos restantes", () => {
    renderWithProviders(<ClientDetailPage />);
    expect(screen.getByText("Laura Méndez")).toBeInTheDocument();
    expect(screen.getByText(/Marketing Lead/)).toBeInTheDocument();
    expect(screen.getByText(/laura@acme.com/)).toBeInTheDocument();
    expect(screen.getByText("Principal")).toBeInTheDocument();
    expect(screen.getByText("Bogotá")).toBeInTheDocument();
    expect(screen.getByText("Colombia")).toBeInTheDocument();
    expect(screen.getByText("Referido")).toBeInTheDocument();
    expect(screen.getByText("NIT / identificación tributaria")).toBeInTheDocument();
    expect(screen.getByText("Empresa")).toBeInTheDocument();
  });
});
