import { ALLOWED_DOCUMENT_EXTENSIONS, MAX_DOCUMENT_SIZE_BYTES } from "./types";
import type { DocumentKind, DocumentRecord } from "./types";

export type FileErrorCode = "fileTooLarge" | "fileTypeNotAllowed";

export function getFileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx <= 0 || idx === fileName.length - 1 ? "" : fileName.slice(idx + 1).toLowerCase();
}

export function fileNameWithoutExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx <= 0 ? fileName : fileName.slice(0, idx);
}

/** Returns an error code, or null when the file is acceptable. */
export function validateFile(file: { name: string; size: number }): FileErrorCode | null {
  const ext = getFileExtension(file.name);
  if (!(ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]).includes(ext)) return "fileTypeNotAllowed";
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) return "fileTooLarge";
  return null;
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface DocumentFilters {
  search?: string;
  kind?: DocumentKind;
  clientId?: string;
  projectId?: string;
  tag?: string;
}

export function filterDocuments(docs: DocumentRecord[], filters: DocumentFilters): DocumentRecord[] {
  const q = filters.search?.trim().toLowerCase();
  return docs.filter((d) => {
    if (q && !d.name.toLowerCase().includes(q)) return false;
    if (filters.kind && d.kind !== filters.kind) return false;
    if (filters.clientId && d.clientId !== filters.clientId) return false;
    if (filters.projectId && d.projectId !== filters.projectId) return false;
    if (filters.tag && !d.tags.includes(filters.tag)) return false;
    return true;
  });
}

export function collectTags(docs: DocumentRecord[]): string[] {
  return Array.from(new Set(docs.flatMap((d) => d.tags))).sort((a, b) => a.localeCompare(b));
}
