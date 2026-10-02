import type { BaseEntity, ID, ISODateTime } from "@/lib/types";

export type MeetingMode = "in_person" | "video" | "call";
export type MeetingStatus = "scheduled" | "done" | "cancelled";

export interface Meeting extends BaseEntity {
  title: string;
  clientId?: ID;
  projectId?: ID;
  startsAt: ISODateTime;
  durationMinutes: number;
  mode: MeetingMode;
  locationOrLink?: string;
  agenda?: string;
  notes?: string;
  status: MeetingStatus;
}
