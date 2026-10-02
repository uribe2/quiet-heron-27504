import type { BaseEntity, ID, ISODate } from "@/lib/types";

export type ProjectBillingType = "hourly" | "fixed";
export type ProjectStatus = "active" | "paused" | "completed" | "cancelled";

export interface Project extends BaseEntity {
  clientId: ID;
  quoteId?: ID;
  name: string;
  description?: string;
  billingType: ProjectBillingType;
  hourlyRateCents?: number;
  budgetCents?: number;
  estimatedHours?: number;
  startDate: ISODate;
  dueDate: ISODate;
  status: ProjectStatus;
}
