import type { LineItem, Totals } from "./types";

/** subtotal/tax/total in cents. Tax is rounded half-up to the cent. */
export function calculateTotals(items: LineItem[], taxRate: number): Totals {
  const subtotalCents = items.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unitPriceCents),
    0,
  );
  const taxCents = Math.round(subtotalCents * (taxRate / 100));
  const totalCents = subtotalCents + taxCents;
  return { subtotalCents, taxCents, totalCents };
}
