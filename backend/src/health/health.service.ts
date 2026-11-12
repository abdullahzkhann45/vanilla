import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ProductsService } from '../products/products.service';
import { OrdersService } from '../orders/orders.service';
import { NotificationsService } from '../notifications/notifications.service';
import { env } from '../env';

/**
 * Preventive monitor. Runs on boot and then hourly, looking for conditions that
 * will BECOME a problem if ignored, and pushes an ntfy heads-up before they do:
 *   - a variant running low on stock      → predicts a stockout
 *   - a product fully sold out            → lost sales right now
 *   - orders sitting unconfirmed too long → predicts angry customers / lost sales
 *   - the database unreachable            → predicts downtime
 * Each distinct warning is de-duplicated so it does not nag every hour.
 */
@Injectable()
export class HealthService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly log = new Logger('Health');
  private timer?: ReturnType<typeof setInterval>;
  private readonly lastSent = new Map<string, number>();
  private readonly RESEND_MS = 12 * 60 * 60 * 1000; // don't repeat the same warning within 12h
  private running = false;

  constructor(
    @InjectConnection() private readonly conn: Connection,
    private products: ProductsService,
    private orders: OrdersService,
    private notifications: NotificationsService,
  ) {}

  onApplicationBootstrap() {
    // First sweep shortly after boot, then every hour.
    setTimeout(() => void this.runChecks('startup'), 20_000);
    this.timer = setInterval(() => void this.runChecks('scheduled'), 60 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  /** Public so an admin endpoint can trigger a sweep on demand. Returns a report. */
  async runChecks(trigger = 'manual') {
    if (this.running) return { skipped: true };
    this.running = true;
    const report: Record<string, unknown> = { trigger, at: new Date().toISOString() };
    try {
      report.db = await this.checkDatabase();
      report.stock = await this.checkStock();
      report.backlog = await this.checkBacklog();
    } catch (e) {
      this.log.error(`health sweep failed: ${String(e)}`);
      report.error = String(e);
    } finally {
      this.running = false;
    }
    return report;
  }

  private shouldSend(key: string): boolean {
    const now = Date.now();
    const last = this.lastSent.get(key) || 0;
    if (now - last < this.RESEND_MS) return false;
    this.lastSent.set(key, now);
    return true;
  }

  private async checkDatabase() {
    const ready = this.conn.readyState === 1; // 1 = connected
    if (!ready && this.shouldSend('db-down')) {
      await this.notifications.alert(
        'Vanilla: database unreachable',
        'The API cannot reach MongoDB. New orders and the storefront may be failing. Check the database.',
        'max',
      );
      this.log.error('DB not connected (readyState != 1)');
    }
    return { connected: ready };
  }

  private async checkStock() {
    const products = await this.products.listAll();
    const low: string[] = [];
    const out: string[] = [];
    for (const p of products as any[]) {
      const active = (p.variants || []).filter((v: any) => v.isActive);
      const totalStock = active.reduce((n: number, v: any) => n + Math.max(0, v.stock), 0);
      if (active.length && totalStock === 0) {
        out.push(p.name);
        continue;
      }
      for (const v of active) {
        if (v.stock > 0 && v.stock <= env.LOW_STOCK_THRESHOLD) {
          low.push(`${p.name} — ${v.size}/${v.colour}: ${v.stock} left`);
        }
      }
    }

    if (out.length && this.shouldSend('out:' + out.sort().join('|'))) {
      await this.notifications.alert(
        `Vanilla: ${out.length} product(s) sold out`,
        ['These are fully out of stock and cannot be ordered:', '', ...out.map((n) => `• ${n}`), '', 'Restock to resume sales.'].join('\n'),
        'high',
      );
    }
    if (low.length && this.shouldSend('low:' + low.sort().join('|'))) {
      await this.notifications.alert(
        `Vanilla: ${low.length} size(s) running low`,
        ['Running low — reorder before they sell out:', '', ...low.map((l) => `• ${l}`)].join('\n'),
        'high',
      );
    }
    return { low: low.length, soldOut: out.length };
  }

  private async checkBacklog() {
    const cutoff = Date.now() - env.ORDER_BACKLOG_HOURS * 60 * 60 * 1000;
    const pending = (await this.orders.list({ status: 'pending_confirmation' })) as any[];
    const stale = pending.filter((o) => new Date(o.createdAt).getTime() < cutoff);
    if (stale.length && this.shouldSend(`backlog:${stale.length >= 10 ? '10+' : stale.length}`)) {
      await this.notifications.alert(
        `Vanilla: ${stale.length} order(s) awaiting confirmation`,
        [
          `${stale.length} COD order(s) have been unconfirmed for over ${env.ORDER_BACKLOG_HOURS}h.`,
          'Confirm them in the admin so they ship and stock is reserved.',
          '',
          ...stale.slice(0, 10).map((o) => `• ${o.orderNumber} — Rs. ${(o.total / 100).toLocaleString('en-PK')}`),
        ].join('\n'),
        'high',
      );
    }
    return { pending: pending.length, stale: stale.length };
  }
}
