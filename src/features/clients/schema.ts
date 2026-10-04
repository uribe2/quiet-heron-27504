import * as z from "zod";
import type { Client } from "./types";

const optionalEmail = z
  .string()
  .trim()
  .refine((v) => v === "" || z.email().safeParse(v).success, "invalidEmail")
  .optional();

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || z.url().safeParse(v).success, "invalidUrl")
  .optional();

const contactFormSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "required"),
  role: z.string().optional(),
  email: optionalEmail,
  phone: z.string().optional(),
  isPrimary: z.boolean(),
});

const baseClientSchema = z.object({
  name: z.string().trim().min(1, "required").min(2, "minLength").max(100, "maxLength"),
  type: z.enum(["company", "individual"]),
  email: optionalEmail,
  phone: z.string().optional(),
  website: optionalUrl,
  taxId: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  contacts: z.array(contactFormSchema),
  tags: z.array(z.string()),
  // The "—" option of the select submits "", which means "no source".
  source: z
    .enum(["referral", "website", "social", "marketplace", "other", ""])
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
          message: "primaryContactRequired",
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
      ctx.addIssue({ code: "custom", path: ["name"], message: "nameTaken" });
    }
  });
}

export type ClientFormValues = z.infer<typeof baseClientSchema>;
