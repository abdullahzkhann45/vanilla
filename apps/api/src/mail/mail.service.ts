import { Injectable, Logger } from '@nestjs/common';
import type { OrderDocument } from '../orders/order.schema';

/**
 * Dev stub: logs mail to console. Wire SMTP (or Postmark/SES) in production.
 * Transactional templates required by PRD: order_confirmed, order_shipped.
 */
@Injectable()
export class MailService {
  private readonly log = new Logger('Mail');

  async orderConfirmed(order: OrderDocument) {
    this.log.log(
      `[mail:order_confirmed] to=${order.email} orderNumber=${order.orderNumber} total=${order.total}`,
    );
  }

  async orderShipped(order: OrderDocument) {
    this.log.log(
      `[mail:order_shipped] to=${order.email} orderNumber=${order.orderNumber} tracking=${order.trackingNumber}`,
    );
  }
}
