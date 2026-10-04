import * as z from "zod";
import { getToday } from "@/lib/dates";

const baseOpportunitySchema = z.object({
  clientId: z.string().min(1, "required"),
  title: z.string().trim().min(1, "required").min(2, "minLength").max(150, "maxLength"),
  /** Amount in currency units (converted to cents on submit). */
  value: z.number("required").min(0, "mustBeNonNegative"),
  stage: z.enum(["contact", "quote", "project", "delivery", "collection"]),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
});

export function buildOpportunitySchema(isCreate: boolean) {
  return baseOpportunitySchema.superRefine((data, ctx) => {
    if (isCreate && data.expectedCloseDate && data.expectedCloseDate < getToday()) {
      ctx.addIssue({ code: "custom", path: ["expectedCloseDate"], message: "dateNotPast" });
    }
  });
}

export type OpportunityFormValues = z.infer<typeof baseOpportunitySchema>;
