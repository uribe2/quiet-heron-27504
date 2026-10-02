import { File, FileCheck, FileText, ClipboardList, Package, Receipt, type LucideIcon } from "lucide-react";
import type { DocumentKind } from "../types";

export const DOCUMENT_KINDS: DocumentKind[] = ["contract", "proposal", "deliverable", "invoice", "brief", "other"];

export const kindIcon: Record<DocumentKind, LucideIcon> = {
  contract: FileCheck,
  proposal: FileText,
  deliverable: Package,
  invoice: Receipt,
  brief: ClipboardList,
  other: File,
};

export function kindLabelKey(kind: DocumentKind): string {
  return `documents.kind${kind.charAt(0).toUpperCase()}${kind.slice(1)}`;
}
