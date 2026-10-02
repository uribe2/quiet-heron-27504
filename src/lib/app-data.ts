import type { Client } from "@/features/clients/types";
import type { Interaction } from "@/features/interactions/types";
import type { Opportunity } from "@/features/pipeline/types";
import type { Project } from "@/features/projects/types";
import type { Deliverable } from "@/features/deliverables/types";
import type { TimeEntry, RunningTimer } from "@/features/time/types";
import type { Quote } from "@/features/quotes/types";
import type { Invoice } from "@/features/invoices/types";
import type { Payment } from "@/features/payments/types";
import type { Meeting } from "@/features/meetings/types";
import type { DocumentRecord } from "@/features/documents/types";
import type { AIConversation } from "@/features/ai/types";
import type { Settings } from "@/features/settings/types";

export interface Collections {
  clients: Client[];
  interactions: Interaction[];
  opportunities: Opportunity[];
  projects: Project[];
  deliverables: Deliverable[];
  timeEntries: TimeEntry[];
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
  meetings: Meeting[];
  documents: DocumentRecord[];
  aiConversations: AIConversation[];
}

export type CollectionKey = keyof Collections;

export interface AppData extends Collections {
  runningTimer: RunningTimer | null;
  settings: Settings;
}
