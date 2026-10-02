import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor, screen, fireEvent } from "@testing-library/react";
import { ProvidersWrapper } from "@/test/render-with-providers";
import { setMockToday } from "@/lib/dates";
import { useData } from "@/context/data-context";
import { useAI } from "../use-ai";
import { useAIConversations, makeTitle } from "../use-ai-conversations";
import { useInteractions } from "@/features/interactions/use-interactions";

afterEach(() => setMockToday(null));

describe("HU-12.1 Ver síntesis ejecutiva y salud de clientes", () => {
  it("exposes isLoading while the summary is pending and then the result", async () => {
    const { result } = renderHook(() => useAI({ delayMs: 0 }), { wrapper: ProvidersWrapper });
    let promise: Promise<string | null> = Promise.resolve(null);
    act(() => {
      promise = result.current.summarize(7);
    });
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
      await promise;
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toContain("Alex Rivera");
  });

  it("sets error when the backend fails and retry re-runs the last call", async () => {
    const generateSummary = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("ok summary");
    const { result } = renderHook(() => useAI({ backend: { generateSummary } }), { wrapper: ProvidersWrapper });

    await act(async () => {
      await result.current.summarize(7);
    });
    expect(result.current.error?.message).toBe("boom");
    expect(result.current.result).toBeNull();

    await act(async () => {
      await result.current.retry();
    });
    await waitFor(() => expect(result.current.result).toBe("ok summary"));
    expect(result.current.error).toBeNull();
    expect(generateSummary).toHaveBeenCalledTimes(2);
  });

  it("retry does nothing when there was no previous call", async () => {
    const { result } = renderHook(() => useAI({ delayMs: 0 }), { wrapper: ProvidersWrapper });
    let value: string | null = "x";
    await act(async () => {
      value = await result.current.retry();
    });
    expect(value).toBeNull();
  });
});

describe("HU-12.2 Preguntar a ClientBrain", () => {
  it("ask resolves with an answer built from real data", async () => {
    const { result } = renderHook(() => useAI({ delayMs: 0 }), { wrapper: ProvidersWrapper });
    await act(async () => {
      await result.current.ask("¿Qué facturas están vencidas?");
    });
    expect(result.current.result).toContain("FAC-1042");
  });

  it("appends user and assistant messages to a new conversation titled by the question", () => {
    const { result } = renderHook(() => useAIConversations(), { wrapper: ProvidersWrapper });
    let id = "";
    act(() => {
      id = result.current.addExchange(null, "¿Cómo va Acme?", "Bien");
    });
    const created = result.current.conversations.find((c) => c.id === id)!;
    expect(created.title).toBe("¿Cómo va Acme?");
    expect(created.messages.map((m) => m.role)).toEqual(["user", "assistant"]);
  });

  it("appends to an existing conversation instead of creating another", () => {
    const { result } = renderHook(() => useAIConversations(), { wrapper: ProvidersWrapper });
    const before = result.current.conversations.length;
    act(() => {
      result.current.addExchange("ai-1", "otra", "resp");
    });
    expect(result.current.conversations).toHaveLength(before);
    expect(result.current.conversations.find((c) => c.id === "ai-1")?.messages).toHaveLength(4);
  });
});

describe("HU-12.3 Generar borradores de seguimiento", () => {
  it("draft resolves with text for the chosen client", async () => {
    const { result } = renderHook(() => useAI({ delayMs: 0 }), { wrapper: ProvidersWrapper });
    await act(async () => {
      await result.current.draft({ clientId: "c-wayne", channel: "email", tone: "formal", goal: "cobrar" });
    });
    expect(result.current.result).toContain("Lucius Fox");
  });

  it("registering a draft creates an interaction through useInteractions", () => {
    const { result } = renderHook(() => ({ i: useInteractions(), d: useData() }), { wrapper: ProvidersWrapper });
    const before = result.current.d.data.interactions.length;
    act(() => {
      result.current.i.createInteraction({
        clientId: "c-wayne",
        channel: "email",
        occurredAt: new Date().toISOString(),
        summary: "Borrador",
        sentiment: "neutral",
      });
    });
    expect(result.current.d.data.interactions).toHaveLength(before + 1);
  });

  it("surfaces draft failures as an error", async () => {
    const draftFollowUp = vi.fn<() => Promise<string>>().mockRejectedValue(new Error("fail"));
    const { result } = renderHook(() => useAI({ backend: { draftFollowUp } }), { wrapper: ProvidersWrapper });
    await act(async () => {
      await result.current.draft({ clientId: "c-wayne", channel: "email", tone: "formal", goal: "" });
    });
    expect(result.current.error).not.toBeNull();
  });
});

describe("HU-12.4 Gestionar historial de conversaciones", () => {
  it("truncates titles to 60 characters", () => {
    expect(makeTitle("a".repeat(100))).toHaveLength(60);
  });

  it("lists pinned conversations first and toggles pin", () => {
    const { result } = renderHook(() => useAIConversations(), { wrapper: ProvidersWrapper });
    let newId = "";
    act(() => {
      newId = result.current.addExchange(null, "nueva", "r");
    });
    expect(result.current.conversations[0].id).toBe(newId);
    act(() => {
      result.current.togglePin(result.current.conversations.find((c) => c.id === "ai-1")!);
    });
    expect(result.current.conversations[0].id).toBe("ai-1");
    expect(result.current.conversations[0].pinned).toBe(true);
  });

  it("renames a conversation and ignores empty names", () => {
    const { result } = renderHook(() => useAIConversations(), { wrapper: ProvidersWrapper });
    act(() => result.current.renameConversation("ai-1", "  Mi título  "));
    expect(result.current.conversations.find((c) => c.id === "ai-1")?.title).toBe("Mi título");
    act(() => result.current.renameConversation("ai-1", "   "));
    expect(result.current.conversations.find((c) => c.id === "ai-1")?.title).toBe("Mi título");
  });

  it("deletes a conversation and restores it through the undo toast", () => {
    const { result } = renderHook(() => useAIConversations(), { wrapper: ProvidersWrapper });
    const target = result.current.conversations.find((c) => c.id === "ai-1")!;
    act(() => result.current.deleteConversation(target));
    expect(result.current.conversations.find((c) => c.id === "ai-1")).toBeUndefined();
    fireEvent.click(screen.getByText("Deshacer"));
    expect(result.current.conversations.find((c) => c.id === "ai-1")).toBeDefined();
  });
});
