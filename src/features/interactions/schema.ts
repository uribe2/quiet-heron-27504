import * as z from "zod";

const baseInteractionSchema = z.object({
  clientId: z.string().min(1, "required"),
  projectId: z.string().optional(),
  channel: z.enum(["call", "email", "whatsapp", "meeting", "note"]),
  /** Local 'YYYY-MM-DDTHH:mm' (datetime-local) or full ISO string. */
  occurredAt: z.string().min(1, "required"),
  summary: z.string().trim().min(1, "required").max(500, "maxLength"),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  followUpDate: z.string().optional(),
});

export const interactionFormSchema = baseInteractionSchema.superRefine((data, ctx) => {
  if (new Date(data.occurredAt).getTime() > Date.now()) {
    ctx.addIssue({ code: "custom", path: ["occurredAt"], message: "dateNotFuture" });
  }
  if (data.followUpDate) {
    const occurredDate = data.occurredAt.slice(0, 10);
    if (data.followUpDate < occurredDate) {
      ctx.addIssue({ code: "custom", path: ["followUpDate"], message: "followUpBeforeDate" });
    }
  }
});

export type InteractionFormValues = z.infer<typeof baseInteractionSchema>;
