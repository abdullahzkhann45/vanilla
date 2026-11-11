import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { OrderDocument } from '../orders/order.schema';

export interface SafepaySession {
  sessionId: string;
  redirectUrl: string;
}

@Injectable()
export class PaymentsService {
  private readonly log = new Logger('Payments');

  async createSafepaySession(order: OrderDocument): Promise<SafepaySession> {
    // STUB: in production, call Safepay REST API with amount, currency, orderNumber.
    // Development mode uses a local success/cancel page that posts back to the webhook.
    const sessionId = 'sp_sess_' + order.orderNumber.toLowerCase();
    const base = process.env.SAFEPAY_REDIRECT_BASE || 'http://localhost:4000/webhooks/payment/mock';
    const redirectUrl = `${base}?order=${order.orderNumber}&session=${sessionId}`;
    this.log.log(`[dev] Safepay session created ${sessionId} for ${order.orderNumber}`);
    return { sessionId, redirectUrl };
  }

  /** Verify HMAC-SHA256 of the raw webhook body. */
  verifySignature(rawBody: Buffer | string, signatureHex: string | undefined): boolean {
    if (!signatureHex) return false;
    const secret = process.env.SAFEPAY_SECRET || 'safepay-webhook-secret';
    const digest = createHmac('sha256', secret).update(rawBody).digest();
    try {
      const sig = Buffer.from(signatureHex, 'hex');
      if (sig.length !== digest.length) return false;
      return timingSafeEqual(sig, digest);
    } catch {
      return false;
    }
  }
}
