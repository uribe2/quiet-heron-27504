import * as z from "zod";
import type { Client } from "./types";

const contactFormSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1),
  role: z.string().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  isPrimary: z.boolean(),
});

const baseClientSchema = z.object({
  name: z.string().trim().min(2).max(100),
  type: z.enum(["company", "individual"]),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().trim().url().optional().or(z.literal("")),
  taxId: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  contacts: z.array(contactFormSchema),
  tags: z.array(z.string()),
  source: z
    .enum(["referral", "website", "social", "marketplace", "other"])
    .optional(),
  notes: z.string().optional(),
});

export function buildClientSchema(existingClients: Client[], excludeId?: string) {
  return baseClientSchema.superRefine((data, ctx) => {
    if (data.contacts.length > 0) {
      const primaryCount = data.contacts.filter((c) => c.isPrimary).length;
      if (primaryCount !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["contacts"],
          message: "primary_contact",
        });
      }
    }
    const normalized = data.name.trim().toLowerCase();
    const taken = existingClients.some(
      (c) =>
        c.status === "active" &&
        c.id !== excludeId &&
        c.name.trim().toLowerCase() === normalized,
    );
    if (taken) {
      ctx.addIssue({ code: "custom", path: ["name"], message: "name_taken" });
    }
  });
}

export type ClientFormValues = z.infer<typeof baseClientSchema>;
