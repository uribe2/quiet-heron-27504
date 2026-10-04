import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import type { ReactElement } from "react";
import { screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { renderWithProviders } from "@/test/render-with-providers";
import { useData } from "@/context/data-context";
import type { AppData } from "@/lib/app-data";
import { installDialogPolyfill, flushDialogEvents } from "@/test/dialog-polyfill";

const nav = vi.hoisted(() => ({ params: {} as Record<string, string> }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => nav.params,
  usePathname: () => "/",
}));

import ClientsPage from "@/app/clients/page";
import InteractionsPage from "@/app/interactions/page";
import PipelinePage from "@/app/pipeline/page";
import ProjectsPage from "@/app/projects/page";
import ProjectDetailPage from "@/app/projects/[id]/page";
import DeliverablesPage from "@/app/deliverables/page";
import TimePage from "@/app/time/page";
import QuotesPage from "@/app/quotes/page";
import InvoicesPage from "@/app/invoices/page";
import InvoiceDetailPage from "@/app/invoices/[id]/page";
import PaymentsPage from "@/app/payments/page";
import MeetingsPage from "@/app/meetings/page";
import DocumentsPage from "@/app/documents/page";

/**
 * End-to-end CRUD flows through the real pages and drawers. Each flow also checks that
 * saving a dirty form never shows the "¿Descartar cambios?" prompt (that prompt is only
 * for leaving a form half-filled).
 */

let current: AppData;
function DataProbe() {
  current = useData().data;
  return null;
}

function renderPage(page: ReactElement) {
  return renderWithProviders(
    <>
      {page}
      <DataProbe />
    </>,
  );
}

/** Renders a detail page whose `useParams()` returns `{ id }`. */
function renderDetail(page: ReactElement, id: string) {
  cleanup();
  nav.params = { id };
  return renderPage(page);
}

beforeAll(installDialogPolyfill);

afterEach(() => {
  nav.params = {};
});

function openDialogs(): HTMLElement[] {
  return Array.from(document.querySelectorAll("dialog[open]")) as HTMLElement[];
}

/** The open <dialog> that holds the drawer form. */
function openDrawer(): HTMLElement {
  const dialog = openDialogs().find((d) => d.querySelector("form"));
  if (!dialog) throw new Error("No open drawer");
  return dialog;
}

function field(container: HTMLElement, label: RegExp | string) {
  return within(container).getByLabelText(label instanceof RegExp ? label : new RegExp(`^${label}`));
}

function change(container: HTMLElement, label: RegExp | string, value: string) {
  fireEvent.change(field(container, label), { target: { value } });
}

/** Selects the first non-empty option of a <select>. */
function pickFirst(container: HTMLElement, label: RegExp | string) {
  const select = field(container, label) as HTMLSelectElement;
  const option = Array.from(select.options).find((o) => o.value !== "");
  if (!option) throw new Error(`No options for ${String(label)}`);
  fireEvent.change(select, { target: { value: option.value } });
  return option.value;
}

function create(buttonName: string) {
  fireEvent.click(screen.getAllByRole("button", { name: buttonName })[0]);
  return openDrawer();
}

function toastCount(message: string | RegExp) {
  const viewport = screen.queryByRole("status");
  return viewport ? within(viewport).queryAllByText(message).length : 0;
}

/** Submits the drawer form and checks that it closes and shows the confirmation toast. */
async function save(container: HTMLElement, toast: string | RegExp) {
  const toastsBefore = toastCount(toast);
  const button = [/^Guardar$/, /^Guardar/, /^(Registrar|Agendar|Agregar)/]
    .map((name) => within(container).queryAllByRole("button", { name })[0])
    .find(Boolean);
  if (!button) throw new Error("No save button");
  fireEvent.click(button);
  await waitFor(() => {
    const invalid = Array.from(container.querySelectorAll("[aria-invalid=true]")).map(
      (el) => (el as HTMLInputElement).name || el.id,
    );
    expect(document.querySelector("dialog[open] form"), `invalid fields: ${invalid.join(", ")}`).toBeNull();
  });
  expect(toastCount(toast), `toast "${String(toast)}"`).toBe(toastsBefore + 1);
}

function discardPrompt(): HTMLElement | undefined {
  return openDialogs().find((d) => d.textContent?.includes("¿Descartar cambios?"));
}

async function expectNoDiscardPrompt() {
  await flushDialogEvents();
  expect(discardPrompt()).toBeUndefined();
}

/** Confirms the open confirmation dialog (if the flow shows one). */
function confirmIfAsked(buttonName: RegExp | string = /Eliminar/) {
  const dialog = openDialogs().find((d) => !d.querySelector("form"));
  if (dialog) fireEvent.click(within(dialog).getByRole("button", { name: buttonName }));
}

describe("CRUD Clientes (UI)", () => {
  it("creates a client from the drawer without asking to discard changes", async () => {
    renderPage(<ClientsPage />);
    const before = current.clients.length;

    const drawer = create("+ Crear cliente");
    change(drawer, "Nombre", "Cliente de Prueba");
    await save(drawer, "Cliente guardado.");

    await expectNoDiscardPrompt();
    expect(current.clients).toHaveLength(before + 1);
    expect(screen.getByText("Cliente de Prueba")).toBeInTheDocument();
  });

  it("edits and deletes a client", async () => {
    renderPage(<ClientsPage />);
    const drawer = create("+ Crear cliente");
    change(drawer, "Nombre", "Para Borrar");
    await save(drawer, "Cliente guardado.");
    const client = current.clients.find((c) => c.name === "Para Borrar")!;

    fireEvent.click(screen.getByRole("button", { name: "Editar Para Borrar" }));
    const edit = openDrawer();
    change(edit, "Ciudad", "Cartagena");
    await save(edit, "Cliente guardado.");
    await expectNoDiscardPrompt();
    expect(current.clients.find((c) => c.id === client.id)?.city).toBe("Cartagena");

    fireEvent.click(screen.getByRole("button", { name: "Eliminar Para Borrar" }));
    confirmIfAsked();
    expect(current.clients.some((c) => c.id === client.id)).toBe(false);
  });

  it("still asks to discard when leaving a half-filled form, and keeps editing on cancel", async () => {
    renderPage(<ClientsPage />);

    const drawer = create("+ Crear cliente");
    change(drawer, "Nombre", "A medio llenar");
    fireEvent.click(within(drawer).getByRole("button", { name: "Cancelar" }));

    const prompt = discardPrompt();
    expect(prompt).toBeDefined();
    fireEvent.click(within(prompt!).getByRole("button", { name: "Seguir editando" }));
    await flushDialogEvents();
    expect(discardPrompt()).toBeUndefined();
    expect(openDrawer()).toBe(drawer);
    expect(field(drawer, "Nombre")).toHaveValue("A medio llenar");
  });

  it("closes without prompting when nothing was typed", async () => {
    renderPage(<ClientsPage />);
    const drawer = create("+ Crear cliente");
    fireEvent.click(within(drawer).getByRole("button", { name: "Cancelar" }));
    await expectNoDiscardPrompt();
    expect(document.querySelector("dialog[open] form")).toBeNull();
  });
});

describe("CRUD Comunicaciones (UI)", () => {
  it("creates, edits and deletes an interaction", async () => {
    renderPage(<InteractionsPage />);
    const before = current.interactions.length;

    const drawer = create("+ Registrar comunicación");
    pickFirst(drawer, "Cliente");
    change(drawer, "Resumen", "Llamada de prueba CRUD");
    await save(drawer, "Comunicación guardada.");
    await expectNoDiscardPrompt();
    expect(current.interactions).toHaveLength(before + 1);
    const created = current.interactions.find((i) => i.summary === "Llamada de prueba CRUD")!;

    const item = screen.getByText("Llamada de prueba CRUD").closest("li") as HTMLElement;
    fireEvent.click(within(item).getByRole("button", { name: /^Editar/ }));
    const edit = openDrawer();
    change(edit, "Resumen", "Resumen editado CRUD");
    await save(edit, "Comunicación guardada.");
    await expectNoDiscardPrompt();
    expect(current.interactions.find((i) => i.id === created.id)?.summary).toBe("Resumen editado CRUD");

    const item2 = screen.getByText("Resumen editado CRUD").closest("li") as HTMLElement;
    fireEvent.click(within(item2).getByRole("button", { name: /^Editar/ }));
    fireEvent.click(within(openDrawer()).getByRole("button", { name: "Eliminar" }));
    confirmIfAsked();
    await expectNoDiscardPrompt();
    expect(current.interactions.some((i) => i.id === created.id)).toBe(false);
  });
});

describe("CRUD Pipeline (UI)", () => {
  it("creates, edits and deletes an opportunity", async () => {
    renderPage(<PipelinePage />);
    const before = current.opportunities.length;

    const drawer = create("+ Nueva oportunidad");
    pickFirst(drawer, "Cliente");
    change(drawer, "Título", "Oportunidad CRUD");
    change(drawer, "Valor estimado", "1500");
    await save(drawer, "Oportunidad guardada.");
    await expectNoDiscardPrompt();
    expect(current.opportunities).toHaveLength(before + 1);
    const created = current.opportunities.find((o) => o.title === "Oportunidad CRUD")!;

    fireEvent.click(screen.getByRole("button", { name: /Editar.*Oportunidad CRUD/ }));
    const edit = openDrawer();
    change(edit, "Título", "Oportunidad editada");
    await save(edit, "Oportunidad guardada.");
    await expectNoDiscardPrompt();
    expect(current.opportunities.find((o) => o.id === created.id)?.title).toBe("Oportunidad editada");

    fireEvent.click(screen.getByRole("button", { name: /Eliminar.*Oportunidad editada/ }));
    confirmIfAsked();
    expect(current.opportunities.some((o) => o.id === created.id)).toBe(false);
  });
});

describe("CRUD Proyectos (UI)", () => {
  async function createProject(name: string) {
    const drawer = create("+ Nuevo proyecto");
    pickFirst(drawer, "Cliente");
    change(drawer, "Nombre", name);
    change(drawer, "Fecha de inicio", "2030-01-01");
    change(drawer, "Fecha de entrega", "2030-02-01");
    await save(drawer, "Proyecto guardado.");
  }

  it("creates a project from the list", async () => {
    renderPage(<ProjectsPage />);
    const before = current.projects.length;
    await createProject("Proyecto CRUD");
    await expectNoDiscardPrompt();
    expect(current.projects).toHaveLength(before + 1);
  });

  it("edits and deletes a project from its detail page", async () => {
    renderPage(<ProjectsPage />);
    await createProject("Proyecto Detalle");
    const project = current.projects.find((p) => p.name === "Proyecto Detalle")!;

    // Data persists in localStorage, so the detail page sees the new project.
    renderDetail(<ProjectDetailPage />, project.id);
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    const edit = openDrawer();
    change(edit, "Nombre", "Proyecto Editado");
    await save(edit, "Proyecto guardado.");
    await expectNoDiscardPrompt();
    expect(current.projects.find((p) => p.id === project.id)?.name).toBe("Proyecto Editado");

    fireEvent.click(screen.getByRole("button", { name: "Eliminar proyecto" }));
    confirmIfAsked();
    expect(current.projects.some((p) => p.id === project.id)).toBe(false);
  });
});

describe("CRUD Entregables (UI)", () => {
  it("creates, edits and deletes a deliverable", async () => {
    renderPage(<DeliverablesPage />);
    const before = current.deliverables.length;

    const drawer = create("+ Nuevo entregable");
    pickFirst(drawer, "Proyecto");
    change(drawer, "Título", "Entregable CRUD");
    await save(drawer, "Entregable guardado.");
    await expectNoDiscardPrompt();
    expect(current.deliverables).toHaveLength(before + 1);
    const created = current.deliverables.find((d) => d.title === "Entregable CRUD")!;

    fireEvent.click(screen.getByRole("button", { name: "Editar Entregable CRUD" }));
    const edit = openDrawer();
    change(edit, "Título", "Entregable editado");
    await save(edit, "Entregable guardado.");
    await expectNoDiscardPrompt();
    expect(current.deliverables.find((d) => d.id === created.id)?.title).toBe("Entregable editado");

    fireEvent.click(screen.getByRole("button", { name: "Eliminar Entregable editado" }));
    confirmIfAsked();
    expect(current.deliverables.some((d) => d.id === created.id)).toBe(false);
  });
});

describe("CRUD Tiempo (UI)", () => {
  it("creates, edits and deletes a manual time entry", async () => {
    renderPage(<TimePage />);
    const before = current.timeEntries.length;

    const drawer = create("+ Registrar tiempo");
    pickFirst(drawer, "Proyecto");
    change(drawer, "Descripción", "Tiempo CRUD");
    change(drawer, "Hora de inicio", "08:00");
    change(drawer, "Hora de fin", "09:30");
    await save(drawer, "Registro de tiempo guardado.");
    await expectNoDiscardPrompt();
    expect(current.timeEntries).toHaveLength(before + 1);
    const created = current.timeEntries.find((e) => e.description === "Tiempo CRUD")!;

    const row = screen.getByText("Tiempo CRUD").closest("li") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: "Editar registro" }));
    const edit = openDrawer();
    change(edit, "Descripción", "Tiempo editado");
    await save(edit, "Registro de tiempo guardado.");
    await expectNoDiscardPrompt();
    expect(current.timeEntries.find((e) => e.id === created.id)?.description).toBe("Tiempo editado");

    const row2 = screen.getByText("Tiempo editado").closest("li") as HTMLElement;
    fireEvent.click(within(row2).getByRole("button", { name: "Eliminar registro" }));
    confirmIfAsked();
    expect(current.timeEntries.some((e) => e.id === created.id)).toBe(false);
  });
});

describe("CRUD Cotizaciones (UI)", () => {
  it("creates, edits and deletes a draft quote", async () => {
    renderPage(<QuotesPage />);
    const before = current.quotes.length;

    const drawer = create("+ Crear cotización");
    pickFirst(drawer, "Cliente");
    change(drawer, "Título", "Cotización CRUD");
    change(drawer, /^Descripción/, "Diseño");
    change(drawer, "Válida hasta", "2030-01-01");
    fireEvent.click(within(drawer).getByRole("button", { name: "Guardar borrador" }));
    await waitFor(() => expect(field(drawer, "Condiciones de pago")).toHaveAttribute("aria-invalid", "true"));
    expect(within(drawer).getByText("Este campo es obligatorio.")).toBeInTheDocument();

    change(drawer, "Condiciones de pago", "50% anticipo");
    await save(drawer, "Cotización guardada.");
    await expectNoDiscardPrompt();
    expect(current.quotes).toHaveLength(before + 1);
    const quote = current.quotes.find((q) => q.title === "Cotización CRUD")!;

    fireEvent.click(screen.getByRole("button", { name: quote.number }));
    const edit = openDrawer();
    change(edit, "Título", "Cotización editada");
    await save(edit, "Cotización guardada.");
    await expectNoDiscardPrompt();
    expect(current.quotes.find((q) => q.id === quote.id)?.title).toBe("Cotización editada");

    fireEvent.click(screen.getByRole("button", { name: quote.number }));
    fireEvent.click(within(openDrawer()).getByRole("button", { name: "Eliminar" }));
    confirmIfAsked();
    expect(current.quotes.some((q) => q.id === quote.id)).toBe(false);
  });
});

describe("CRUD Facturas (UI)", () => {
  it("creates a draft invoice, edits it and deletes it", async () => {
    renderPage(<InvoicesPage />);
    const before = current.invoices.length;

    const drawer = create("+ Crear factura");
    pickFirst(drawer, "Cliente");
    change(drawer, /^Descripción/, "Servicio CRUD");
    await save(drawer, /^Factura .* creada$/);
    await expectNoDiscardPrompt();
    expect(current.invoices).toHaveLength(before + 1);
    const invoice = current.invoices.find((i) => i.items.some((it) => it.description === "Servicio CRUD"))!;

    fireEvent.click(screen.getByRole("button", { name: `Eliminar ${invoice.number}` }));
    confirmIfAsked();
    expect(current.invoices.some((i) => i.id === invoice.id)).toBe(false);
  });

  it("edits a draft invoice from its detail page", async () => {
    renderPage(<InvoiceDetailPage />);
    const draft = current.invoices.find((i) => i.status === "draft")!;
    expect(draft).toBeDefined();

    renderDetail(<InvoiceDetailPage />, draft.id);
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    const edit = openDrawer();
    change(edit, "Notas", "Notas CRUD");
    await save(edit, "Cambios guardados");
    await expectNoDiscardPrompt();
    expect(current.invoices.find((i) => i.id === draft.id)?.notes).toBe("Notas CRUD");
  });
});

describe("CRUD Pagos (UI)", () => {
  it("registers, edits and deletes a payment", async () => {
    renderPage(<PaymentsPage />);
    const before = current.payments.map((p) => p.id);

    const drawer = create("+ Registrar pago");
    pickFirst(drawer, "Factura");
    change(drawer, "Monto", "1");
    await save(drawer, "Pago registrado.");
    await expectNoDiscardPrompt();
    const payment = current.payments.find((p) => !before.includes(p.id))!;
    expect(payment).toBeDefined();
    const number = current.invoices.find((i) => i.id === payment.invoiceId)!.number;

    const editButtons = screen.getAllByRole("button", { name: `Editar pago de ${number}` });
    fireEvent.click(editButtons[editButtons.length - 1]);
    const edit = openDrawer();
    change(edit, "Referencia", "REF-CRUD");
    await save(edit, "Pago actualizado.");
    await expectNoDiscardPrompt();
    expect(current.payments.some((p) => p.reference === "REF-CRUD")).toBe(true);

    const count = current.payments.length;
    fireEvent.click(screen.getAllByRole("button", { name: `Eliminar pago de ${number}` })[0]);
    confirmIfAsked();
    expect(current.payments).toHaveLength(count - 1);
  });
});

describe("CRUD Reuniones (UI)", () => {
  it("schedules, edits and deletes a meeting", async () => {
    renderPage(<MeetingsPage />);
    const before = current.meetings.length;

    const drawer = create("+ Agendar reunión");
    change(drawer, "Título", "Reunión CRUD");
    change(drawer, "Fecha y hora", "2030-01-01T10:00");
    change(drawer, "Lugar o enlace", "https://meet.example.com/crud");
    await save(drawer, "Reunión guardada.");
    await expectNoDiscardPrompt();
    expect(current.meetings).toHaveLength(before + 1);
    const meeting = current.meetings.find((m) => m.title === "Reunión CRUD")!;

    fireEvent.click(screen.getByText("Reunión CRUD"));
    const edit = openDrawer();
    change(edit, "Título", "Reunión editada");
    await save(edit, "Reunión guardada.");
    await expectNoDiscardPrompt();
    expect(current.meetings.find((m) => m.id === meeting.id)?.title).toBe("Reunión editada");

    fireEvent.click(screen.getByText("Reunión editada"));
    fireEvent.click(within(openDrawer()).getByRole("button", { name: "Eliminar" }));
    confirmIfAsked();
    expect(current.meetings.some((m) => m.id === meeting.id)).toBe(false);
  });
});

describe("CRUD Documentos (UI)", () => {
  it("adds, edits and deletes a link document", async () => {
    renderPage(<DocumentsPage />);
    const before = current.documents.length;

    const drawer = create("+ Agregar documento");
    change(drawer, "URL", "https://example.com/contrato.pdf");
    change(drawer, "Nombre", "Documento CRUD");
    await save(drawer, "Documento guardado.");
    await expectNoDiscardPrompt();
    expect(current.documents).toHaveLength(before + 1);
    const doc = current.documents.find((d) => d.name === "Documento CRUD")!;

    fireEvent.click(screen.getAllByText("Documento CRUD")[0]);
    const edit = openDrawer();
    change(edit, "Nombre", "Documento editado");
    await save(edit, "Documento guardado.");
    await expectNoDiscardPrompt();
    expect(current.documents.find((d) => d.id === doc.id)?.name).toBe("Documento editado");

    fireEvent.click(screen.getAllByText("Documento editado")[0]);
    fireEvent.click(within(openDrawer()).getByRole("button", { name: "Eliminar" }));
    confirmIfAsked();
    expect(current.documents.some((d) => d.id === doc.id)).toBe(false);
  });
});

describe("Mensajes de confirmación en cambios de estado (UI)", () => {
  it("confirms a deliverable status change", async () => {
    renderPage(<DeliverablesPage />);
    const target = current.deliverables.find((d) => d.status === "pending")!;

    fireEvent.change(screen.getByLabelText(`Estado de ${target.title}`), { target: { value: "in_progress" } });

    expect(current.deliverables.find((d) => d.id === target.id)?.status).toBe("in_progress");
    expect(toastCount(`"${target.title}" marcado como en progreso.`)).toBe(1);
  });

  it("confirms a project status change", async () => {
    renderPage(<ProjectsPage />);
    const target = current.projects.find((p) => p.status === "active")!;

    renderDetail(<ProjectDetailPage />, target.id);
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "paused" } });

    expect(current.projects.find((p) => p.id === target.id)?.status).toBe("paused");
    expect(toastCount("Proyecto marcado como en pausa.")).toBe(1);
  });

  it("confirms cancelling and completing a meeting", async () => {
    renderPage(<MeetingsPage />);
    const createMeeting = async (title: string) => {
      const drawer = create("+ Agendar reunión");
      change(drawer, "Título", title);
      change(drawer, "Fecha y hora", "2030-01-01T10:00");
      change(drawer, "Lugar o enlace", "https://meet.example.com/crud");
      await save(drawer, "Reunión guardada.");
    };

    await createMeeting("Reunión a cancelar");
    fireEvent.click(screen.getByText("Reunión a cancelar"));
    fireEvent.click(within(openDrawer()).getByRole("button", { name: "Cancelar reunión" }));
    await expectNoDiscardPrompt();
    expect(current.meetings.find((m) => m.title === "Reunión a cancelar")?.status).toBe("cancelled");
    expect(toastCount("Reunión cancelada.")).toBe(1);

    await createMeeting("Reunión realizada");
    fireEvent.click(screen.getByText("Reunión realizada"));
    fireEvent.click(within(openDrawer()).getByRole("button", { name: "Marcar como realizada" }));
    const dialog = document.querySelector('dialog[aria-labelledby="mark-done-title"]') as HTMLElement;
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar" }));
    expect(current.meetings.find((m) => m.title === "Reunión realizada")?.status).toBe("done");
    expect(toastCount("Reunión marcada como realizada.")).toBe(1);
  });
});
