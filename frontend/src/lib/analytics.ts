import { sendGAEvent } from '@next/third-parties/google';

// GA4 is enabled only when the measurement ID is present.
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Prices are stored as integer paisa. GA4 expects a decimal rupee amount
// (6500.00, not 650000). Integer math first, then divide, to avoid float drift.
const toRupees = (paisa: number) => Math.round(paisa) / 100;

export type GAItemInput = {
  id: string;          // item_id — variant SKU or product id
  name: string;        // item_name
  pricePaisa: number;  // unit price, in paisa
  quantity?: number;   // defaults to 1
};

/**
 * The single source of truth for an ecommerce item. Every event builds its
 * items[] through this, so the shape is identical across all four.
 */
function buildItem({ id, name, pricePaisa, quantity = 1 }: GAItemInput) {
  return {
    item_id: id,
    item_name: name,
    price: toRupees(pricePaisa), // per-unit, in rupees
    quantity,
  };
}

function send(event: string, params: Record<string, unknown>) {
  if (!GA_ID) return; // analytics disabled
  sendGAEvent('event', event, params);
}

export function trackViewItem(item: GAItemInput) {
  send('view_item', {
    currency: 'PKR',
    value: toRupees(item.pricePaisa),
    items: [buildItem(item)],
  });
}

export function trackAddToCart(item: GAItemInput & { quantity: number }) {
  send('add_to_cart', {
    currency: 'PKR',
    value: toRupees(item.pricePaisa * item.quantity),
    items: [buildItem(item)],
  });
}

export function trackBeginCheckout(cartValuePaisa: number, items: GAItemInput[]) {
  send('begin_checkout', {
    currency: 'PKR',
    value: toRupees(cartValuePaisa),
    items: items.map(buildItem),
  });
}

export function trackPurchase(orderNumber: string, totalPaisa: number, items: GAItemInput[]) {
  send('purchase', {
    transaction_id: orderNumber,
    currency: 'PKR',
    value: toRupees(totalPaisa),
    items: items.map(buildItem),
  });
}
