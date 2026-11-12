import { Injectable, Logger } from '@nestjs/common';
import type { OrderDocument } from '../orders/order.schema';
import { env } from '../env';

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on delivery',
};

/**
 * Push a full order alert to an ntfy.sh topic when a new order comes in.
 * Contains everything the dispatcher needs to ship: items, totals, and the
 * customer's name, phone, email and full address. Fire-and-forget — a
 * notification failure must never affect the order.
 *
 * NOTE: this body carries customer PII, so the ntfy topic must be private
 * and hard to guess (anyone who knows the topic name can read it).
 */
@Injectable()
export class NotificationsService {
  private readonly log = new Logger('Notifications');

  private rs(paisa: number): string {
    return `Rs. ${(paisa / 100).toLocaleString('en-PK')}`;
  }

  /**
   * Ops/health alert — a heads-up about a developing problem (low stock, order
   * backlog, DB trouble). Goes to NTFY_ALERT_TOPIC (falls back to NTFY_TOPIC).
   * Fire-and-forget; never throws.
   */
  async alert(title: string, body: string, priority: 'default' | 'high' | 'max' = 'high'): Promise<void> {
    const topic = env.NTFY_ALERT_TOPIC;
    if (!topic) return;
    try {
      // Title must be ASCII for the HTTP header.
      const asciiTitle = title.replace(/[^\x20-\x7E]/g, '').trim() || 'Vanilla alert';
      const res = await fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        headers: { Title: asciiTitle, Priority: priority, Tags: 'warning' },
        body,
      });
      if (!res.ok) this.log.warn(`alert POST failed: ${res.status} ${res.statusText}`);
    } catch (err) {
      this.log.warn(`alert error: ${String(err)}`);
    }
  }

  async newOrder(order: OrderDocument): Promise<void> {
    const topic = env.NTFY_TOPIC;
    if (!topic) {
      this.log.warn(`NTFY_TOPIC empty — skipping notification for ${order.orderNumber}`);
      return;
    }

    try {
      const payment = PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod;
      const s = order.shipping;

      const itemLines = order.items.map(
        (i) => `• ${i.quantity}× ${i.productName} — ${i.size} / ${i.colour} — ${this.rs(i.unitPrice * i.quantity)}`,
      );

      const addressLines = [
        s.fullName,
        s.phone,
        order.email,
        s.line1,
        s.line2 || null,
        [s.city, s.province, s.postalCode].filter(Boolean).join(', '),
        s.country,
      ].filter(Boolean);

      const body = [
        `${order.orderNumber}  ·  ${payment}`,
        '',
        'ITEMS',
        ...itemLines,
        '',
        `Subtotal: ${this.rs(order.subtotal)}`,
        order.discountAmount > 0 ? `Discount: -${this.rs(order.discountAmount)}${order.discountCode ? ` (${order.discountCode})` : ''}` : null,
        `Shipping: ${order.shippingAmount === 0 ? 'Free' : this.rs(order.shippingAmount)}`,
        `TOTAL: ${this.rs(order.total)}`,
        '',
        'SHIP TO',
        ...addressLines,
      ].filter((l) => l !== null).join('\n');

      const res = await fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        headers: {
          // Header values must be ASCII — no em-dash.
          Title: `New order ${order.orderNumber} - ${this.rs(order.total)}`,
          Priority: 'high',
          Tags: 'package',
        },
        body,
      });
      if (!res.ok) {
        this.log.warn(`ntfy POST failed for ${order.orderNumber}: ${res.status} ${res.statusText}`);
      } else {
        this.log.log(`ntfy sent for ${order.orderNumber}`);
      }
    } catch (err) {
      this.log.warn(`ntfy notification error for ${order.orderNumber}: ${String(err)}`);
    }
  }
}
