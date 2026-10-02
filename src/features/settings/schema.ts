import * as z from "zod";

// Messages are i18n keys resolved by the form.
export const settingsFormSchema = z.object({
  userName: z.string().trim().min(2, "validation.minLength").max(100, "validation.maxLength"),
  businessName: z.string().trim().min(2, "validation.minLength").max(100, "validation.maxLength"),
  currency: z.enum(["USD", "COP"]),
  defaultHourlyRateCents: z
    .number("settings.errRate")
    .int("settings.errRate")
    .min(0, "settings.errRate"),
  defaultTaxRate: z
    .number("settings.errTax")
    .min(0, "settings.errTax")
    .max(100, "settings.errTax"),
  defaultPaymentTermsDays: z
    .number("settings.errTerms")
    .int("settings.errTerms")
    .min(0, "settings.errTerms"),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
