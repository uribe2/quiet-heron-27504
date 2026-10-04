import * as z from "zod";

const baseProjectSchema = z.object({
  clientId: z.string().min(1, "required"),
  name: z.string().trim().min(2, { error: (iss) => (String(iss.input ?? "").trim() === "" ? "required" : "minLength") }).max(100, "maxLength"),
  description: z.string().optional(),
  billingType: z.enum(["hourly", "fixed"]),
  hourlyRateCents: z.number().min(0, "mustBeNonNegative").optional(),
  budgetCents: z.number().min(0, "mustBeNonNegative").optional(),
  estimatedHours: z.number().min(0, "mustBeNonNegative").optional(),
  startDate: z.string().min(1, "required"),
  dueDate: z.string().min(1, "required"),
});

export const projectFormSchema = baseProjectSchema.superRefine((data, ctx) => {
  if (data.billingType === "hourly" && data.hourlyRateCents == null) {
    ctx.addIssue({ code: "custom", path: ["hourlyRateCents"], message: "required" });
  } else if (data.billingType === "hourly" && !(data.hourlyRateCents! > 0)) {
    ctx.addIssue({ code: "custom", path: ["hourlyRateCents"], message: "mustBePositive" });
  }
  if (data.billingType === "fixed" && data.budgetCents == null) {
    ctx.addIssue({ code: "custom", path: ["budgetCents"], message: "required" });
  } else if (data.billingType === "fixed" && !(data.budgetCents! > 0)) {
    ctx.addIssue({ code: "custom", path: ["budgetCents"], message: "mustBePositive" });
  }
  if (data.startDate && data.dueDate && data.dueDate < data.startDate) {
    ctx.addIssue({ code: "custom", path: ["dueDate"], message: "endAfterStart" });
  }
});

export type ProjectFormValues = z.infer<typeof baseProjectSchema>;
