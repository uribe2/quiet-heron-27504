import { describe, it, expect, beforeAll } from "vitest";
import { renderHook, act, screen, fireEvent, waitFor } from "@testing-library/react";
import { settingsFormSchema, type SettingsFormValues } from "../schema";
import { useSettings } from "../use-settings";
import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { ProvidersWrapper, renderWithProviders } from "@/test/render-with-providers";
import SettingsPage from "@/app/settings/page";

const valid: SettingsFormValues = {
  userName: "Alex Rivera",
  businessName: "Freelancer OS",
  currency: "USD",
  defaultHourlyRateCents: 8500,
  defaultTaxRate: 19,
  defaultPaymentTermsDays: 15,
};

describe("Configuración", () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  });

  it("accepts valid values and rejects out-of-range rate, tax and terms", () => {
    expect(settingsFormSchema.safeParse(valid).success).toBe(true);
    expect(settingsFormSchema.safeParse({ ...valid, defaultHourlyRateCents: -1 }).success).toBe(false);
    expect(settingsFormSchema.safeParse({ ...valid, defaultTaxRate: 101 }).success).toBe(false);
    expect(settingsFormSchema.safeParse({ ...valid, defaultTaxRate: -0.5 }).success).toBe(false);
    expect(settingsFormSchema.safeParse({ ...valid, defaultPaymentTermsDays: 1.5 }).success).toBe(false);
    expect(settingsFormSchema.safeParse({ ...valid, defaultPaymentTermsDays: -1 }).success).toBe(false);
    expect(settingsFormSchema.safeParse({ ...valid, defaultTaxRate: Number.NaN }).success).toBe(false);
  });

  it("updateSettings changes settings and the money currency", () => {
    const { result } = renderHook(() => ({ s: useSettings(), i: useTranslation() }), {
      wrapper: ProvidersWrapper,
    });
    expect(result.current.s.settings.currency).toBe("USD");
    const before = result.current.i.formatMoney(100000);

    act(() => {
      result.current.s.updateSettings({ ...valid, currency: "COP", defaultTaxRate: 19 });
    });

    expect(result.current.s.settings.currency).toBe("COP");
    expect(result.current.s.settings.defaultTaxRate).toBe(19);
    expect(result.current.i.formatMoney(100000)).not.toBe(before);
  });

  it("resetDemoData restores the seed data", () => {
    const { result } = renderHook(() => ({ s: useSettings(), d: useData() }), {
      wrapper: ProvidersWrapper,
    });
    const initial = result.current.d.data.clients.length;
    act(() => {
      result.current.d.dispatch({ type: "REMOVE", collection: "clients", id: result.current.d.data.clients[0].id });
      result.current.s.updateSettings({ ...valid, userName: "Otra Persona" });
    });
    expect(result.current.d.data.clients).toHaveLength(initial - 1);

    act(() => {
      result.current.s.resetDemoData();
    });

    expect(result.current.d.data.clients).toHaveLength(initial);
    expect(result.current.s.settings.userName).toBe("Alex Rivera");
  });

  it("asks for confirmation before resetting demo data", async () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Configuración" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Restablecer datos de demostración" }));
    const confirm = await screen.findByRole("button", { name: "Sí, restablecer" });
    fireEvent.click(confirm);

    await waitFor(() => expect(screen.getByText("Datos de demostración restablecidos.")).toBeInTheDocument());
  });

  it("shows a helpful error for an invalid tax rate", async () => {
    renderWithProviders(<SettingsPage />);
    fireEvent.change(screen.getByLabelText(/Impuesto por defecto/), { target: { value: "150" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText(/entre 0 y 100/, { selector: "p[id$='-error']" })).toBeInTheDocument();
  });
});
