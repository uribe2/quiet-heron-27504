import type { BaseEntity, ID, ISODate, ISODateTime } from "@/lib/types";

export type DeliverableStatus = "pending" | "in_progress" | "delivered";

export interface Deliverable extends BaseEntity {
  projectId: ID;
  title: string;
  description?: string;
  dueDate: ISODate;
  status: DeliverableStatus;
  order: number;
  externalUrl?: string;
  deliveredAt?: ISODateTime;
}
