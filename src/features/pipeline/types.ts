import type { BaseEntity, ID, ISODate } from "@/lib/types";

export type OpportunityStage =
  | "contact"
  | "quote"
  | "project"
  | "delivery"
  | "collection";
export type OpportunityStatus = "open" | "won" | "lost";
export type LostReason = "price" | "timing" | "scope" | "no_response" | "other";

export interface Opportunity extends BaseEntity {
  clientId: ID;
  title: string;
  estimatedValueCents: number;
  stage: OpportunityStage;
  status: OpportunityStatus;
  lostReason?: LostReason;
  expectedCloseDate?: ISODate;
  position: number;
  quoteId?: ID;
  projectId?: ID;
  notes?: string;
}

export const OPPORTUNITY_STAGES: OpportunityStage[] = [
  "contact",
  "quote",
  "project",
  "delivery",
  "collection",
];
