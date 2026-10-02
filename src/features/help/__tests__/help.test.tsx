import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "@/test/render-with-providers";
import HelpPage from "@/app/help/page";
import { es } from "@/i18n/es";
import { en } from "@/i18n/en";
import { useTranslation } from "@/context/i18n-context";
import { useEffect } from "react";

function EnglishHelp() {
  const { setLang } = useTranslation();
  useEffect(() => setLang("en"), [setLang]);
  return <HelpPage />;
}

describe("Ayuda", () => {
  it("renders one h1 and the five areas in Spanish", () => {
    renderWithProviders(<HelpPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    for (const name of ["Relación", "Ejecución", "Cierre", "Organización", "Inteligencia"]) {
      expect(screen.getByRole("heading", { level: 3, name })).toBeInTheDocument();
    }
  });

  it("renders the glossary as a definition list", () => {
    renderWithProviders(<HelpPage />);
    const heading = screen.getByRole("heading", { name: es.help.glossaryTitle });
    const section = heading.closest("section") as HTMLElement;
    expect(section.querySelector("dl")).not.toBeNull();
    expect(within(section).getByText("MRR")).toBeInTheDocument();
    expect(within(section).getByText("NIT")).toBeInTheDocument();
    expect(within(section).getByText("IA simulada")).toBeInTheDocument();
  });

  it("renders areas and glossary in English", async () => {
    renderWithProviders(<EnglishHelp />);
    expect(await screen.findByRole("heading", { level: 3, name: "Relationship" })).toBeInTheDocument();
    for (const name of ["Execution", "Closing", "Organization", "Intelligence"]) {
      expect(screen.getByRole("heading", { level: 3, name })).toBeInTheDocument();
    }
    expect(screen.getByText("Simulated AI")).toBeInTheDocument();
    expect(screen.getByText(en.help.termMrrDef)).toBeInTheDocument();
  });
});

