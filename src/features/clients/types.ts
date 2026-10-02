import type { BaseEntity, ID } from "@/lib/types";

export interface Contact {
  id: ID;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
}

export type ClientType = "company" | "individual";
export type ClientSource =
  | "referral"
  | "website"
  | "social"
  | "marketplace"
  | "other";
export type ClientStatus = "active" | "archived";

export interface Client extends BaseEntity {
  name: string;
  type: ClientType;
  email?: string;
  phone?: string;
  website?: string;
  taxId?: string;
  city?: string;
  country?: string;
  contacts: Contact[];
  tags: string[];
  source?: ClientSource;
  notes?: string;
  status: ClientStatus;
}
