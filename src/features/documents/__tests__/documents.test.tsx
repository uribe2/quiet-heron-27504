import { describe, it, expect } from "vitest";
import { renderHook, act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useDocuments } from "../use-documents";
import { useData } from "@/context/data-context";
import { ProvidersWrapper } from "@/test/render-with-providers";
import { buildDocumentSchema, type DocumentFormValues } from "../schema";
import { DocumentForm } from "../components/document-form";
import {
  collectTags,
  fileNameWithoutExtension,
  filterDocuments,
  getFileExtension,
  validateFile,
} from "../logic";
import { MAX_DOCUMENT_SIZE_BYTES } from "../types";

const linkValues: DocumentFormValues = {
  name: "Spec",
  kind: "brief",
  sourceType: "link",
  url: "https://example.com/spec",
  tags: ["a", "b"],
};

function useBoth() {
  return { docs: useDocuments(), data: useData() };
}

describe("HU-11.1 Listar documentos", () => {
  it("filters by kind, client, project and tag", () => {
    const { result } = renderHook(() => useDocuments(), { wrapper: ProvidersWrapper });
    const docs = result.current.documents;
    expect(filterDocuments(docs, { kind: "contract" }).map((d) => d.id)).toEqual(["doc-1"]);
    expect(filterDocuments(docs, { clientId: "c-techcorp" }).map((d) => d.id)).toEqual(["doc-2"]);
    expect(filterDocuments(docs, { projectId: "p-2" }).map((d) => d.id)).toEqual(["doc-5"]);
    expect(filterDocuments(docs, { tag: "legal" }).map((d) => d.id)).toEqual(["doc-1"]);
  });

  it("searches by name case-insensitively", () => {
    const { result } = renderHook(() => useDocuments(), { wrapper: ProvidersWrapper });
    expect(filterDocuments(result.current.documents, { search: "ACME" }).map((d) => d.id)).toEqual(["doc-1"]);
    expect(filterDocuments(result.current.documents, { search: "zzz" })).toEqual([]);
  });

  it("collects unique sorted tags", () => {
    const { result } = renderHook(() => useDocuments(), { wrapper: ProvidersWrapper });
    const tags = collectTags(result.current.documents);
    expect(tags).toEqual([...tags].sort());
    expect(tags).toContain("legal");
  });
});

describe("HU-11.2 Agregar documento", () => {
  it("rejects files over 10 MB and disallowed extensions", () => {
    expect(validateFile({ name: "a.pdf", size: MAX_DOCUMENT_SIZE_BYTES + 1 })).toBe("fileTooLarge");
    expect(validateFile({ name: "a.exe", size: 10 })).toBe("fileTypeNotAllowed");
    expect(validateFile({ name: "noext", size: 10 })).toBe("fileTypeNotAllowed");
    expect(validateFile({ name: "A.PDF", size: MAX_DOCUMENT_SIZE_BYTES })).toBeNull();
  });

  it("derives the default name and extension from the file name", () => {
    expect(fileNameWithoutExtension("contrato.final.pdf")).toBe("contrato.final");
    expect(getFileExtension("x.JPG")).toBe("jpg");
  });

  it("schema requires a valid URL for links and valid metadata for files", () => {
    const schema = buildDocumentSchema("create");
    expect(schema.safeParse(linkValues).success).toBe(true);
    expect(schema.safeParse({ ...linkValues, url: "nope" }).success).toBe(false);
    expect(schema.safeParse({ ...linkValues, sourceType: "file" }).success).toBe(false);
    const big = { fileName: "a.pdf", mimeType: "application/pdf", sizeBytes: MAX_DOCUMENT_SIZE_BYTES + 1 };
    expect(schema.safeParse({ ...linkValues, sourceType: "file", file: big }).success).toBe(false);
    expect(schema.safeParse({ ...linkValues, sourceType: "file", file: { ...big, sizeBytes: 5 } }).success).toBe(true);
  });

  it("stores only metadata for file documents", () => {
    const { result } = renderHook(() => useDocuments(), { wrapper: ProvidersWrapper });
    const before = result.current.documents.length;
    act(() => {
      result.current.createDocument({
        ...linkValues,
        sourceType: "file",
        file: { fileName: "a.pdf", mimeType: "application/pdf", sizeBytes: 5 },
      });
    });
    expect(result.current.documents).toHaveLength(before + 1);
    expect(result.current.documents.at(-1)?.source).toEqual({
      type: "file",
      fileName: "a.pdf",
      mimeType: "application/pdf",
      sizeBytes: 5,
    });
  });

  it("prefills the name when a file is chosen", async () => {
    const user = userEvent.setup();
    render(<DocumentForm clients={[]} projects={[]} onSubmit={() => {}} />, { wrapper: ProvidersWrapper });
    await user.selectOptions(screen.getAllByRole("combobox")[0], "file");
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, new File(["x"], "brief-final.pdf", { type: "application/pdf" }));
    expect(screen.getByDisplayValue("brief-final")).toBeTruthy();
  });
});

describe("HU-11.3 Editar documento", () => {
  it("updates name, kind, tags, description, client and project", () => {
    const { result } = renderHook(() => useDocuments(), { wrapper: ProvidersWrapper });
    act(() => {
      result.current.updateDocument("doc-2", {
        ...linkValues,
        name: "Renamed",
        clientId: "c-acme",
        projectId: "p-1",
        description: "d",
      });
    });
    const doc = result.current.documents.find((d) => d.id === "doc-2")!;
    expect(doc).toMatchObject({ name: "Renamed", kind: "brief", clientId: "c-acme", projectId: "p-1", tags: ["a", "b"], description: "d" });
    expect(doc.source).toEqual({ type: "link", url: "https://drive.example.com/propuesta-techcorp" });
  });

  it("clears client and project when empty", () => {
    const { result } = renderHook(() => useDocuments(), { wrapper: ProvidersWrapper });
    act(() => {
      result.current.updateDocument("doc-1", { ...linkValues, clientId: "", projectId: "" });
    });
    const doc = result.current.documents.find((d) => d.id === "doc-1")!;
    expect(doc.clientId).toBeUndefined();
    expect(doc.projectId).toBeUndefined();
  });

  it("edit schema validates the shared fields only", () => {
    const schema = buildDocumentSchema("edit");
    expect(schema.safeParse({ ...linkValues, url: "" }).success).toBe(true);
    expect(schema.safeParse({ ...linkValues, name: " " }).success).toBe(false);
  });
});

describe("HU-11.4 Eliminar documento", () => {
  it("removes the document immediately", () => {
    const { result } = renderHook(() => useBoth(), { wrapper: ProvidersWrapper });
    act(() => {
      result.current.docs.deleteDocument(result.current.docs.documents[0]);
    });
    expect(result.current.data.data.documents.find((d) => d.id === "doc-1")).toBeUndefined();
  });

  it("restores the document with its links at its original index", () => {
    const { result } = renderHook(() => useBoth(), { wrapper: ProvidersWrapper });
    const target = result.current.docs.documents[2];
    act(() => {
      result.current.docs.deleteDocument(target);
    });
    act(() => {
      result.current.data.dispatch({ type: "RESTORE", collection: "documents", item: target, index: 2 });
    });
    expect(result.current.data.data.documents[2]).toEqual(target);
    expect(result.current.data.data.documents).toHaveLength(6);
  });

  it("deleted document no longer appears in client or project views", () => {
    const { result } = renderHook(() => useBoth(), { wrapper: ProvidersWrapper });
    act(() => {
      result.current.docs.deleteDocument(result.current.docs.documents[0]);
    });
    const docs = result.current.data.data.documents;
    expect(docs.filter((d) => d.clientId === "c-acme")).toHaveLength(0);
    expect(docs.filter((d) => d.projectId === "p-1")).toHaveLength(0);
  });
});
