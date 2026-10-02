import type { BaseEntity, ID, ISODate } from "@/lib/types";

export type PaymentMethod = "transfer" | "card" | "cash" | "other";

export interface Payment extends BaseEntity {
  invoiceId: ID;
  amountCents: number;
  date: ISODate;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}
