export type ID = string;
export type ISODate = string; // 'YYYY-MM-DD'
export type ISODateTime = string; // full ISO 8601

export interface BaseEntity {
  id: ID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface LineItem {
  id: ID;
  description: string;
  quantity: number;
  unitPriceCents: number;
  timeEntryIds?: ID[];
}

export interface Totals {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
}
