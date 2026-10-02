import type { BaseEntity, ID, ISODateTime } from "@/lib/types";

export interface TimeEntry extends BaseEntity {
  projectId: ID;
  deliverableId?: ID;
  description: string;
  startedAt: ISODateTime;
  endedAt: ISODateTime;
  durationMinutes: number;
  billable: boolean;
  invoiceId?: ID;
}

export interface RunningTimer {
  projectId: ID;
  deliverableId?: ID;
  description: string;
  startedAt: ISODateTime;
}
