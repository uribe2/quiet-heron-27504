import { describe, it, expect, vi, beforeAll } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { installDialogPolyfill, flushDialogEvents } from "@/test/dialog-polyfill";
import { Drawer } from "../drawer";

beforeAll(installDialogPolyfill);

function Harness({ onRequestClose }: { onRequestClose: () => void }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <>
      <Drawer isOpen={isOpen} onClose={onRequestClose} title="Drawer" closeLabel="Cerrar">
        <button type="button" onClick={() => setIsOpen(false)}>
          Guardar
        </button>
      </Drawer>
      <span data-testid="state">{isOpen ? "open" : "closed"}</span>
    </>
  );
}

describe("Drawer", () => {
  it("does not call onClose when the parent closes it (e.g. after saving)", async () => {
    const onRequestClose = vi.fn();
    render(<Harness onRequestClose={onRequestClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await flushDialogEvents();

    expect(screen.getByTestId("state")).toHaveTextContent("closed");
    expect(onRequestClose).not.toHaveBeenCalled();
  });

  it("routes Escape through onClose and keeps the dialog open until the parent decides", () => {
    const onRequestClose = vi.fn();
    render(<Harness onRequestClose={onRequestClose} />);
    const dialog = document.querySelector("dialog")!;

    const cancel = new Event("cancel", { cancelable: true });
    dialog.dispatchEvent(cancel);

    expect(cancel.defaultPrevented).toBe(true);
    expect(onRequestClose).toHaveBeenCalledTimes(1);
    expect(dialog).toHaveAttribute("open");
  });

  it("calls onClose from the close button", () => {
    const onRequestClose = vi.fn();
    render(<Harness onRequestClose={onRequestClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it("reopens and asks the parent if the browser closes it on its own", async () => {
    const onRequestClose = vi.fn();
    render(<Harness onRequestClose={onRequestClose} />);
    const dialog = document.querySelector("dialog")!;

    dialog.close();
    await flushDialogEvents();

    expect(onRequestClose).toHaveBeenCalledTimes(1);
    expect(dialog).toHaveAttribute("open");
  });
});
