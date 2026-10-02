import type { BaseEntity, ID, ISODate, ISODateTime, LineItem } from "@/lib/types";

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected";

export type QuoteHistoryAction =
  | "created"
  | "updated"
  | "sent"
  | "accepted"
  | "rejected"
  | "reverted_to_draft"
  | "converted"
  | "duplicated";

export interface QuoteHistoryEntry {
  at: ISODateTime;
  action: QuoteHistoryAction;
  note?: string;
}

export interface Quote extends BaseEntity {
  number: string;
  clientId: ID;
  opportunityId?: ID;
  title: string;
  items: LineItem[];
  taxRate: number;
  paymentTerms: string;
  validUntil: ISODate;
  scope?: string;
  status: QuoteStatus;
  history: QuoteHistoryEntry[];
  projectId?: ID;
}
