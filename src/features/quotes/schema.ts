import * as z from "zod";

const lineItemFormSchema = z.object({
  id: z.string(),
  description: z.string().trim().min(1),
  quantity: z.number().positive(),
  unitPriceCents: z.number().min(0),
});

export const quoteFormSchema = z.object({
  clientId: z.string().min(1),
  opportunityId: z.string().optional(),
  title: z.string().trim().min(2).max(150),
  items: z.array(lineItemFormSchema).min(1),
  taxRate: z.number().min(0).max(100),
  paymentTerms: z.string().trim().min(1),
  validUntil: z.string().min(1),
  scope: z.string().optional(),
});

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;
