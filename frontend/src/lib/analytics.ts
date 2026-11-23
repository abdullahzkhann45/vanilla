import { sendGAEvent } from '@next/third-parties/google';

// GA4 is enabled only when the measurement ID is present.
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
// Meta (Facebook) Pixel is enabled only when the pixel ID is present.
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Meta Pixel global, injected by the <MetaPixel> base code.
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function fbTrack(event: string, params: Record<string, unknown>) {
  if (!META_PIXEL_ID) return;
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', event, params);
  }
}

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
  fbTrack('ViewContent', {
    content_type: 'product',
    content_ids: [item.id],
    content_name: item.name,
    currency: 'PKR',
    value: toRupees(item.pricePaisa),
  });
}

export function trackAddToCart(item: GAItemInput & { quantity: number }) {
  send('add_to_cart', {
    currency: 'PKR',
    value: toRupees(item.pricePaisa * item.quantity),
    items: [buildItem(item)],
  });
  fbTrack('AddToCart', {
    content_type: 'product',
    content_ids: [item.id],
    content_name: item.name,
    contents: [{ id: item.id, quantity: item.quantity }],
    currency: 'PKR',
    value: toRupees(item.pricePaisa * item.quantity),
  });
}

export function trackBeginCheckout(cartValuePaisa: number, items: GAItemInput[]) {
  send('begin_checkout', {
    currency: 'PKR',
    value: toRupees(cartValuePaisa),
    items: items.map(buildItem),
  });
  fbTrack('InitiateCheckout', {
    content_type: 'product',
    content_ids: items.map((i) => i.id),
    contents: items.map((i) => ({ id: i.id, quantity: i.quantity ?? 1 })),
    num_items: items.reduce((n, i) => n + (i.quantity ?? 1), 0),
    currency: 'PKR',
    value: toRupees(cartValuePaisa),
  });
}

export function trackPurchase(orderNumber: string, totalPaisa: number, items: GAItemInput[]) {
  send('purchase', {
    transaction_id: orderNumber,
    currency: 'PKR',
    value: toRupees(totalPaisa),
    items: items.map(buildItem),
  });
  fbTrack('Purchase', {
    content_type: 'product',
    content_ids: items.map((i) => i.id),
    contents: items.map((i) => ({ id: i.id, quantity: i.quantity ?? 1 })),
    num_items: items.reduce((n, i) => n + (i.quantity ?? 1), 0),
    currency: 'PKR',
    value: toRupees(totalPaisa),
    order_id: orderNumber,
  });
}
