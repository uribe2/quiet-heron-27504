import type { BaseEntity, ID } from "@/lib/types";

export type DocumentKind =
  | "contract"
  | "proposal"
  | "deliverable"
  | "invoice"
  | "brief"
  | "other";

export type DocumentSource =
  | { type: "link"; url: string }
  | { type: "file"; fileName: string; mimeType: string; sizeBytes: number };

export interface DocumentRecord extends BaseEntity {
  name: string;
  kind: DocumentKind;
  clientId?: ID;
  projectId?: ID;
  source: DocumentSource;
  tags: string[];
  description?: string;
}

export const ALLOWED_DOCUMENT_EXTENSIONS = [
  "pdf",
  "docx",
  "xlsx",
  "pptx",
  "png",
  "jpg",
  "jpeg",
  "zip",
] as const;

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
