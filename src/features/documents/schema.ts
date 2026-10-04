import * as z from "zod";
import { validateFile, isValidUrl } from "./logic";

export const DOCUMENT_NAME_MAX = 150;
export const DOCUMENT_DESCRIPTION_MAX = 1000;

const baseDocumentSchema = z.object({
  name: z.string().trim().min(1, "required").max(DOCUMENT_NAME_MAX, "maxLength"),
  kind: z.enum(["contract", "proposal", "deliverable", "invoice", "brief", "other"]),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  sourceType: z.enum(["link", "file"]),
  url: z.string().optional(),
  file: z.object({ fileName: z.string(), mimeType: z.string(), sizeBytes: z.number() }).optional(),
  tags: z.array(z.string()),
  description: z.string().max(DOCUMENT_DESCRIPTION_MAX, "maxLength").optional(),
});

/** In edit mode the source is immutable, so only the shared fields are validated. */
export function buildDocumentSchema(mode: "create" | "edit") {
  return baseDocumentSchema.superRefine((data, ctx) => {
    if (mode === "edit") return;
    if (data.sourceType === "link") {
      if (!data.url?.trim()) {
        ctx.addIssue({ code: "custom", path: ["url"], message: "required" });
      } else if (!isValidUrl(data.url.trim())) {
        ctx.addIssue({ code: "custom", path: ["url"], message: "invalidUrl" });
      }
    } else if (!data.file) {
      ctx.addIssue({ code: "custom", path: ["file"], message: "fileRequired" });
    } else {
      const error = validateFile({ name: data.file.fileName, size: data.file.sizeBytes });
      if (error) ctx.addIssue({ code: "custom", path: ["file"], message: error });
    }
  });
}

export type DocumentFormValues = z.infer<typeof baseDocumentSchema>;
