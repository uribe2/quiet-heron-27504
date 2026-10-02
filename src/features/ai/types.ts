import type { BaseEntity, ID, ISODateTime } from "@/lib/types";

export type AIMessageRole = "user" | "assistant";
export type AIMessageKind = "answer" | "draft" | "summary";

export interface AIMessage {
  id: ID;
  role: AIMessageRole;
  content: string;
  kind?: AIMessageKind;
  createdAt: ISODateTime;
}

export interface AIConversation extends BaseEntity {
  title: string;
  clientId?: ID;
  messages: AIMessage[];
  pinned: boolean;
}

export interface ClientHealth {
  score: number;
  label: "healthy" | "attention" | "critical";
}
