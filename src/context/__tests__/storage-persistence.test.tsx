import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataProvider } from "../data-context";
import { I18nProvider, useTranslation } from "../i18n-context";
import { createSeedData } from "@/lib/seed";

function Probe() {
  const { lang } = useTranslation();
  return <span data-testid="lang">{lang}</span>;
}

function renderApp() {
  return render(
    <DataProvider>
      <I18nProvider>
        <Probe />
      </I18nProvider>
    </DataProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("Persistence on load never overwrites stored values", () => {
  it("keeps the stored language: 'es' is never written over 'en'", () => {
    window.localStorage.setItem("clientbrain:lang", "en");
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    renderApp();

    expect(screen.getByTestId("lang")).toHaveTextContent("en");
    expect(setItem.mock.calls.filter(([key]) => key === "clientbrain:lang")).toEqual([]);
    expect(window.localStorage.getItem("clientbrain:lang")).toBe("en");
  });

  it("never writes the seed over the user's stored data", () => {
    const stored = createSeedData();
    stored.settings.userName = "Usuario Guardado";
    window.localStorage.setItem("clientbrain:data", JSON.stringify(stored));
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    renderApp();

    const dataWrites = setItem.mock.calls.filter(([key]) => key === "clientbrain:data");
    expect(dataWrites.length).toBeGreaterThan(0);
    for (const [, value] of dataWrites) expect(value).toContain("Usuario Guardado");
  });
});
