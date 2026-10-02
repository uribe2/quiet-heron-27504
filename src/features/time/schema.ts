import * as z from "zod";
import { validateManualEntry } from "./logic";

export const baseTimeEntrySchema = z.object({
  projectId: z.string().min(1, "required"),
  deliverableId: z.string().optional(),
  date: z.string().min(1, "required"),
  startTime: z.string().min(1, "required"),
  endTime: z.string().min(1, "required"),
  description: z.string().trim().min(1, "required").max(300, "maxLength"),
  billable: z.boolean(),
});

export const timeEntrySchema = baseTimeEntrySchema.superRefine((data, ctx) => {
  if (!data.date || !data.startTime || !data.endTime) return;
  const error = validateManualEntry(data);
  if (error && error !== "required") {
    ctx.addIssue({ code: "custom", path: ["endTime"], message: error });
  }
});

export type TimeEntryFormValues = z.infer<typeof baseTimeEntrySchema>;
