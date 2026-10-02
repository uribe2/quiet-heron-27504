export type Currency = "USD" | "COP";

export interface Settings {
  userName: string;
  businessName: string;
  plan: string;
  currency: Currency;
  defaultHourlyRateCents: number;
  defaultTaxRate: number;
  defaultPaymentTermsDays: number;
}
