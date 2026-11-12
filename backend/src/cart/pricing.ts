/**
 * Pure pricing math — no DB, no framework. Isolated so it can be unit-tested
 * without a database and so there is exactly one place totals are computed.
 */
export type DiscountKind = 'percentage' | 'fixed';

export interface PriceLineInput {
  unitPrice: number; // paisa
  quantity: number;
}

export interface PricingSettings {
  flatShippingRate: number; // paisa
  freeShippingThreshold: number; // paisa
}

export interface DiscountRule {
  kind: DiscountKind;
  value: number; // percentage (0-100) or paisa for 'fixed'
}

export function priceLines(lines: PriceLineInput[]): number {
  return lines.reduce((s, l) => s + Math.max(0, l.unitPrice) * Math.max(0, l.quantity), 0);
}

export function computeDiscount(subtotal: number, d?: DiscountRule | null): number {
  if (!d) return 0;
  if (d.kind === 'percentage') {
    const v = Math.max(0, Math.min(100, d.value));
    return Math.floor((subtotal * v) / 100);
  }
  return Math.max(0, Math.min(subtotal, Math.floor(d.value)));
}

export function computeShipping(afterDiscount: number, s: PricingSettings): number {
  return afterDiscount >= s.freeShippingThreshold ? 0 : s.flatShippingRate;
}

export function computeTotals(lines: PriceLineInput[], s: PricingSettings, d?: DiscountRule | null) {
  const subtotal = priceLines(lines);
  const discountAmount = computeDiscount(subtotal, d);
  const shippingAmount = computeShipping(subtotal - discountAmount, s);
  const total = Math.max(0, subtotal - discountAmount + shippingAmount);
  return { subtotal, discountAmount, shippingAmount, total };
}
