import * as z from "zod";

/** `maxCents` = available balance (plus previous amount when editing). */
export function buildPaymentSchema(maxCents: number, today: string) {
  return z
    .object({
      invoiceId: z.string().min(1),
      amount: z.number().positive(),
      date: z.string().min(1),
      method: z.enum(["transfer", "card", "cash", "other"]),
      reference: z.string().optional(),
      notes: z.string().optional(),
    })
    .superRefine((val, ctx) => {
      if (Math.round(val.amount * 100) > maxCents) {
        ctx.addIssue({ code: "custom", path: ["amount"], message: "exceedsBalance" });
      }
      if (val.date > today) {
        ctx.addIssue({ code: "custom", path: ["date"], message: "dateNotFuture" });
      }
    });
}

export type PaymentFormValues = z.infer<ReturnType<typeof buildPaymentSchema>>;
