import type { BaseEntity, ID, ISODate, LineItem } from "@/lib/types";

export type InvoiceStatus = "draft" | "sent" | "paid" | "cancelled";
export type InvoiceDisplayStatus = InvoiceStatus | "overdue" | "partially_paid";

export interface Invoice extends BaseEntity {
  number: string;
  clientId: ID;
  projectId?: ID;
  quoteId?: ID;
  issueDate: ISODate;
  dueDate: ISODate;
  items: LineItem[];
  taxRate: number;
  notes?: string;
  status: InvoiceStatus;
}

export interface InvoiceFinancials {
  totalCents: number;
  paidCents: number;
  balanceCents: number;
  displayStatus: InvoiceDisplayStatus;
}
