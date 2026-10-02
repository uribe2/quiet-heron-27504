import * as z from "zod";

const baseProjectSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().trim().min(2).max(100),
  description: z.string().optional(),
  billingType: z.enum(["hourly", "fixed"]),
  hourlyRateCents: z.number().optional(),
  budgetCents: z.number().optional(),
  estimatedHours: z.number().optional(),
  startDate: z.string().min(1),
  dueDate: z.string().min(1),
});

export const projectFormSchema = baseProjectSchema.superRefine((data, ctx) => {
  if (data.billingType === "hourly" && !(data.hourlyRateCents && data.hourlyRateCents > 0)) {
    ctx.addIssue({ code: "custom", path: ["hourlyRateCents"], message: "required" });
  }
  if (data.billingType === "fixed" && !(data.budgetCents && data.budgetCents > 0)) {
    ctx.addIssue({ code: "custom", path: ["budgetCents"], message: "required" });
  }
  if (data.dueDate < data.startDate) {
    ctx.addIssue({ code: "custom", path: ["dueDate"], message: "endAfterStart" });
  }
});

export type ProjectFormValues = z.infer<typeof baseProjectSchema>;
