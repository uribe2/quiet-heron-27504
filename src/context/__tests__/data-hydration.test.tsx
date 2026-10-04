import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import { DataProvider, useData } from "../data-context";

function Probe() {
  const { isHydrated } = useData();
  return <span data-testid="probe">{isHydrated ? "hydrated" : "pending"}</span>;
}

describe("DataProvider hydration flag", () => {
  it("is false in server-rendered HTML, so date-dependent pages are not prerendered", () => {
    const html = renderToString(
      <DataProvider>
        <Probe />
      </DataProvider>,
    );
    expect(html).toContain("pending");
  });

  it("becomes true on the client once localStorage has been read", () => {
    render(
      <DataProvider>
        <Probe />
      </DataProvider>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("hydrated");
  });
});
