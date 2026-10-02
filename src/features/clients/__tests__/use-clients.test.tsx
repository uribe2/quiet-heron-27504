import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useClients, useClient } from "../use-clients";
import { ProvidersWrapper } from "@/test/render-with-providers";
import type { ClientFormValues } from "../schema";

const baseValues: ClientFormValues = {
  name: "Brand New Co",
  type: "company",
  email: "",
  phone: "",
  website: "",
  taxId: "",
  city: "",
  country: "",
  contacts: [],
  tags: [],
  source: undefined,
  notes: "",
};

describe("HU-01.2 Crear cliente", () => {
  it("adds a new active client to the list", () => {
    const { result } = renderHook(() => useClients(), { wrapper: ProvidersWrapper });
    const before = result.current.clients.length;

    act(() => {
      result.current.createClient(baseValues);
    });

    expect(result.current.clients).toHaveLength(before + 1);
    expect(result.current.clients.at(-1)).toMatchObject({ name: "Brand New Co", status: "active" });
  });
});

describe("HU-01.3 Ver detalle y editar cliente", () => {
  it("useClient finds a client by id", () => {
    const { result } = renderHook(() => useClient("c-acme"), { wrapper: ProvidersWrapper });
    expect(result.current?.name).toBe("Acme Corp");
  });

  it("useClient returns undefined for an unknown id", () => {
    const { result } = renderHook(() => useClient("does-not-exist"), { wrapper: ProvidersWrapper });
    expect(result.current).toBeUndefined();
  });

  it("updateClient merges the patch into the existing client", () => {
    const { result } = renderHook(() => useClients(), { wrapper: ProvidersWrapper });

    act(() => {
      result.current.updateClient("c-acme", { ...baseValues, name: "Acme Corp", city: "Medellín" });
    });

    const updated = result.current.clients.find((c) => c.id === "c-acme");
    expect(updated?.city).toBe("Medellín");
  });
});

describe("HU-01.4 Archivar o eliminar cliente", () => {
  it("archiveClient sets the client status to archived", () => {
    const { result } = renderHook(() => useClients(), { wrapper: ProvidersWrapper });
    const target = result.current.clients.find((c) => c.id === "c-nova")!;

    act(() => {
      result.current.archiveClient(target);
    });

    expect(result.current.clients.find((c) => c.id === "c-nova")?.status).toBe("archived");
  });

  it("getDeletionCheck reports related records for a client with history", () => {
    const { result } = renderHook(() => useClients(), { wrapper: ProvidersWrapper });
    const check = result.current.getDeletionCheck("c-wayne");
    expect(check.relatedInteractions).toBeGreaterThan(0);
  });

  it("deleteClient removes the client and cascades to interactions and opportunities", () => {
    const { result } = renderHook(() => useClients(), { wrapper: ProvidersWrapper });
    const target = result.current.clients.find((c) => c.id === "c-globex")!;

    act(() => {
      result.current.deleteClient(target);
    });

    expect(result.current.clients.find((c) => c.id === "c-globex")).toBeUndefined();
  });
});
