import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTranslation } from "../i18n-context";
import { ProvidersWrapper } from "@/test/render-with-providers";

describe("i18n language switch", () => {
  it("defaults to Spanish", () => {
    const { result } = renderHook(() => useTranslation(), { wrapper: ProvidersWrapper });
    expect(result.current.lang).toBe("es");
    expect(result.current.t("common.save")).toBe("Guardar");
  });

  it("switches translated strings when setLang changes", () => {
    const { result } = renderHook(() => useTranslation(), { wrapper: ProvidersWrapper });

    act(() => result.current.setLang("en"));

    expect(result.current.lang).toBe("en");
    expect(result.current.t("common.save")).toBe("Save");
  });

  it("updates document.documentElement.lang", () => {
    const { result } = renderHook(() => useTranslation(), { wrapper: ProvidersWrapper });

    act(() => result.current.setLang("en"));

    expect(document.documentElement.lang).toBe("en");
  });

  it("interpolates variables into translated strings", () => {
    const { result } = renderHook(() => useTranslation(), { wrapper: ProvidersWrapper });
    expect(result.current.t("dashboard.greeting", { name: "Alex" })).toBe("Hola, Alex");
  });
});
