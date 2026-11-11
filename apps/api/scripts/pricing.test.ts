import { computeTotals } from '../src/cart/pricing';

const settings = { flatShippingRate: 20000, freeShippingThreshold: 500000 };

function eq(name: string, got: any, want: any) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? '✓' : '✗') + ' ' + name, ok ? '' : `\n   got:  ${JSON.stringify(got)}\n   want: ${JSON.stringify(want)}`);
  if (!ok) process.exitCode = 1;
}

// 1 line, under threshold -> flat shipping
eq('under threshold adds flat shipping',
  computeTotals([{ unitPrice: 100000, quantity: 1 }], settings),
  { subtotal: 100000, discountAmount: 0, shippingAmount: 20000, total: 120000 });

// Over threshold -> free shipping
eq('>= threshold free shipping',
  computeTotals([{ unitPrice: 300000, quantity: 2 }], settings),
  { subtotal: 600000, discountAmount: 0, shippingAmount: 0, total: 600000 });

// 10% discount, rounded down to paisa
eq('10% discount floored',
  computeTotals([{ unitPrice: 123457, quantity: 1 }], settings, { kind: 'percentage', value: 10 }),
  // 10% of 123457 = 12345.7 -> floor -> 12345
  // afterDiscount = 111112 which is below threshold -> +20000 shipping
  { subtotal: 123457, discountAmount: 12345, shippingAmount: 20000, total: 131112 });

// Fixed discount cannot exceed subtotal
eq('fixed discount capped at subtotal',
  computeTotals([{ unitPrice: 1000, quantity: 1 }], settings, { kind: 'fixed', value: 100000 }),
  { subtotal: 1000, discountAmount: 1000, shippingAmount: 20000, total: 20000 });

// Discount that pushes under threshold loses free shipping
eq('discount drops you under free-ship threshold',
  computeTotals([{ unitPrice: 500000, quantity: 1 }], settings, { kind: 'percentage', value: 5 }),
  // 5% of 500000 = 25000. after = 475000 < 500000 -> +20000 shipping
  { subtotal: 500000, discountAmount: 25000, shippingAmount: 20000, total: 495000 });

// No float drift: 0.1 + 0.2 kind of math — everything stays integer
eq('integer-only math',
  computeTotals([{ unitPrice: 10, quantity: 3 }, { unitPrice: 20, quantity: 1 }], settings),
  { subtotal: 50, discountAmount: 0, shippingAmount: 20000, total: 20050 });

// Negative/zero defences
eq('zero and negative treated safely',
  computeTotals([{ unitPrice: -100, quantity: 2 }, { unitPrice: 100, quantity: 0 }], settings),
  { subtotal: 0, discountAmount: 0, shippingAmount: 20000, total: 20000 });

if (process.exitCode) {
  console.log('\nSome assertions failed.');
} else {
  console.log('\nAll pricing assertions passed.');
}
