'use client';
import { useEffect, useRef } from 'react';
import { trackPurchase, GAItemInput } from '@/lib/analytics';

/**
 * Fires GA4 `purchase` once for this order. Deduped via sessionStorage so a
 * page refresh does not double-count the transaction.
 */
export function PurchaseEvent({
  orderNumber,
  totalPaisa,
  items,
}: {
  orderNumber: string;
  totalPaisa: number;
  items: GAItemInput[];
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const key = `vnl_purchase_${orderNumber}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // sessionStorage unavailable — still fire once per mount
    }
    trackPurchase(orderNumber, totalPaisa, items);
  }, [orderNumber, totalPaisa, items]);

  return null;
}
