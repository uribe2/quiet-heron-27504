import { act } from "@testing-library/react";

/**
 * jsdom lacks `showModal`/`close`. Like real browsers, `close()` fires the `close`
 * event asynchronously (a queued task), which matters for components that react to it.
 */
export function installDialogPolyfill() {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    setTimeout(() => this.dispatchEvent(new Event("close")), 0);
  };
}

/** Lets pending `close` events fire and React settle. */
export async function flushDialogEvents() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}
