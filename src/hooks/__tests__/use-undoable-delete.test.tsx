import { describe, it, expect, vi } from "vitest";
import { renderHook, act, screen, fireEvent } from "@testing-library/react";
import { useUndoableDelete } from "../use-undoable-delete";
import { ProvidersWrapper } from "@/test/render-with-providers";

describe("useUndoableDelete", () => {
  it("calls onDelete immediately", () => {
    const onDelete = vi.fn();
    const onRestore = vi.fn();
    const { result } = renderHook(() => useUndoableDelete(), { wrapper: ProvidersWrapper });

    act(() => {
      result.current.deleteWithUndo({ item: { id: "1" }, message: "Eliminado", onDelete, onRestore });
    });

    expect(onDelete).toHaveBeenCalledWith({ id: "1" });
  });

  it("shows a toast with an Undo action", () => {
    const onDelete = vi.fn();
    const onRestore = vi.fn();
    const { result } = renderHook(() => useUndoableDelete(), { wrapper: ProvidersWrapper });

    act(() => {
      result.current.deleteWithUndo({ item: { id: "1" }, message: "Eliminado", onDelete, onRestore });
    });

    expect(screen.getByText("Eliminado")).toBeInTheDocument();
    expect(screen.getByText("Deshacer")).toBeInTheDocument();
  });

  it("calls onRestore when the Undo action is clicked", () => {
    const onDelete = vi.fn();
    const onRestore = vi.fn();
    const { result } = renderHook(() => useUndoableDelete(), { wrapper: ProvidersWrapper });

    act(() => {
      result.current.deleteWithUndo({ item: { id: "1" }, message: "Eliminado", onDelete, onRestore });
    });
    fireEvent.click(screen.getByText("Deshacer"));

    expect(onRestore).toHaveBeenCalledWith({ id: "1" });
  });
});
