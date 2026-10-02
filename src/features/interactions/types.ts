import type { BaseEntity, ID, ISODate, ISODateTime } from "@/lib/types";

export type InteractionChannel =
  | "call"
  | "email"
  | "whatsapp"
  | "meeting"
  | "note";
export type Sentiment = "positive" | "neutral" | "negative";

export interface Interaction extends BaseEntity {
  clientId: ID;
  projectId?: ID;
  meetingId?: ID;
  channel: InteractionChannel;
  occurredAt: ISODateTime;
  summary: string;
  sentiment: Sentiment;
  followUpDate?: ISODate;
  followUpDone: boolean;
}
