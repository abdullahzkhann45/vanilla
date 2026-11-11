import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import { MailService } from '../mail/mail.service';

@Controller('webhooks/payment')
export class PaymentsController {
  private readonly log = new Logger('PaymentsWebhook');

  constructor(
    private payments: PaymentsService,
    private orders: OrdersService,
    private mail: MailService,
  ) {}

  /**
   * The gateway webhook. Signature verified; this is the ONLY thing that flips an
   * order to paid. The browser success URL is never trusted.
   */
  @Post()
  async webhook(@Req() req: Request, @Headers('x-safepay-signature') sig: string, @Body() body: any) {
    const raw = (req as any).rawBody || Buffer.from(JSON.stringify(body));
    if (!this.payments.verifySignature(raw, sig)) {
      throw new BadRequestException('Invalid signature');
    }
    const { orderNumber, status } = body;
    if (!orderNumber) throw new BadRequestException('Missing orderNumber');

    const order = await this.orders.getByNumber(orderNumber);

    if (status === 'paid' && order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      await order.save();
      await this.orders.confirmAndDecrementStock(order);
      await this.mail.orderConfirmed(order);
      this.log.log(`${orderNumber} confirmed via webhook`);
    } else if (status === 'failed') {
      order.paymentStatus = 'failed';
      await order.save();
    }
    return { ok: true };
  }

  /**
   * DEV-ONLY mock redirect endpoint. In production Safepay redirects the buyer to
   * their hosted page; the real signed webhook is posted server-to-server.
   * Here we simulate "paid" by posting a signed payload back to /webhooks/payment.
   */
  @Get('mock')
  async mock(@Query('order') orderNumber: string, @Res() res: Response) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).send('Not found');
    }
    const { createHmac } = await import('crypto');
    const payload = JSON.stringify({ orderNumber, status: 'paid' });
    const sig = createHmac('sha256', process.env.SAFEPAY_SECRET || 'safepay-webhook-secret')
      .update(payload)
      .digest('hex');
    const url = `http://127.0.0.1:${process.env.PORT || 4000}/webhooks/payment`;
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-safepay-signature': sig },
      body: payload,
    });
    const success = `${process.env.STOREFRONT_ORIGIN || 'http://localhost:3000'}/order/${orderNumber}`;
    res.redirect(success);
  }
}
