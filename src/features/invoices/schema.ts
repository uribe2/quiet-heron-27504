import * as z from "zod";

const lineItemFormSchema = z.object({
  id: z.string(),
  description: z.string().trim().min(1),
  quantity: z.number().positive(),
  unitPriceCents: z.number().min(0),
  timeEntryIds: z.array(z.string()).optional(),
});

export const invoiceFormSchema = z
  .object({
    clientId: z.string().min(1),
    projectId: z.string().optional(),
    quoteId: z.string().optional(),
    issueDate: z.string().min(1),
    dueDate: z.string().min(1),
    items: z.array(lineItemFormSchema).min(1),
    taxRate: z.number().min(0).max(100),
    notes: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.issueDate && val.dueDate && val.dueDate < val.issueDate) {
      ctx.addIssue({ code: "custom", path: ["dueDate"], message: "dueBeforeIssue" });
    }
  });

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
