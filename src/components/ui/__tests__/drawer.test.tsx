import { describe, it, expect, beforeAll, vi } from "vitest";
import { render } from "@testing-library/react";
import { Drawer } from "../drawer";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

function renderDrawer(isOpen: boolean, onClose: () => void) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Drawer" closeLabel="Cerrar">
      <p>content</p>
    </Drawer>
  );
}

describe("Drawer close handling", () => {
  it("does not call onClose when the parent closes it programmatically", () => {
    const onClose = vi.fn();
    const { rerender } = render(renderDrawer(true, onClose));
    rerender(renderDrawer(false, onClose));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("routes Escape (cancel event) through onClose and keeps the dialog open", () => {
    const onClose = vi.fn();
    const { container } = render(renderDrawer(true, onClose));
    const dialog = container.querySelector("dialog")!;
    const event = new Event("cancel", { cancelable: true });
    dialog.dispatchEvent(event);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    expect(dialog.hasAttribute("open")).toBe(true);
  });
});
