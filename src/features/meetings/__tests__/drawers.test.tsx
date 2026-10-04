import { describe, it, expect, beforeAll, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ProvidersWrapper } from "@/test/render-with-providers";
import { MeetingForm } from "../components/meeting-form";
import { MeetingDrawer } from "../components/meeting-drawer";
import { DocumentDrawer } from "@/features/documents/components/document-drawer";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

describe("Drawer: no reaparece '¿Descartar cambios?' tras guardar", () => {
  it("meeting drawer", async () => {
    const props = { clients: [], projects: [], onClose: () => {}, onSubmit: () => {} };
    const { rerender } = render(<MeetingDrawer isOpen {...props} />, { wrapper: ProvidersWrapper });
    fireEvent.change(document.querySelector("input")!, { target: { value: "Nueva" } });
    fireEvent.input(document.querySelector("input")!, { target: { value: "Nueva reunión" } });
    await act(async () => {});
    rerender(<MeetingDrawer isOpen={false} {...props} />);
    await act(async () => {});
    expect(document.querySelectorAll("dialog[open]").length).toBe(0);
  });

  it("document drawer", async () => {
    const props = { clients: [], projects: [], onClose: () => {}, onSubmit: () => {} };
    const { rerender } = render(<DocumentDrawer isOpen {...props} />, { wrapper: ProvidersWrapper });
    const input = screen.getByPlaceholderText("https://");
    fireEvent.input(input, { target: { value: "https://a.com" } });
    await act(async () => {});
    rerender(<DocumentDrawer isOpen={false} {...props} />);
    await act(async () => {});
    expect(document.querySelectorAll("dialog[open]").length).toBe(0);
  });
});

describe("HU-10.3 Editar reunión programada", () => {
  it("MeetingForm requires a future date when editing a scheduled meeting but not a done one", async () => {
                const mk = (status: "scheduled" | "done") => ({
      id: "m1",
      createdAt: "",
      updatedAt: "",
      title: "Old",
      startsAt: new Date(Date.now() - 86400000).toISOString(),
      durationMinutes: 30,
      mode: "call" as const,
      status,
    });
    const onSubmit = vi.fn();
    const { unmount } = render(<MeetingForm meeting={mk("scheduled")} clients={[]} projects={[]} onSubmit={onSubmit} />, { wrapper: ProvidersWrapper });
    fireEvent.submit(document.getElementById("meeting-form")!);
    await waitFor(() => expect(screen.getByText("La fecha debe ser futura.")).toBeTruthy());
    expect(onSubmit).not.toHaveBeenCalled();
    unmount();
    render(<MeetingForm meeting={mk("done")} clients={[]} projects={[]} onSubmit={onSubmit} />, { wrapper: ProvidersWrapper });
    fireEvent.submit(document.getElementById("meeting-form")!);
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });
});
