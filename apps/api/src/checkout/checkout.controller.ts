import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CartService } from '../cart/cart.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';
import { MailService } from '../mail/mail.service';
import { CheckoutSessionDto } from './dto';

@Controller('checkout')
export class CheckoutController {
  constructor(
    private cart: CartService,
    private orders: OrdersService,
    private payments: PaymentsService,
    private mail: MailService,
  ) {}

  // Rate-limit checkout: 10/min per IP
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('session')
  async session(@Body() dto: CheckoutSessionDto) {
    const totals = await this.cart.priceCart(dto.cartId);

    if (!totals.lines.length) throw new BadRequestException('Cart is empty');
    for (const l of totals.lines) {
      if (!l.inStock) throw new BadRequestException(`Sold out: ${l.productName} / ${l.size} / ${l.colour}`);
    }
    if (totals.total <= 0) throw new BadRequestException('Invalid order total');

    // Build order snapshot (name/price/image copied in; never a live reference)
    const items = totals.lines.map((l) => ({
      productId: l.productId,
      productSlug: l.productSlug,
      productName: l.productName,
      variantSku: l.variantSku,
      size: l.size,
      colour: l.colour,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
      imageUrl: l.imageUrl,
    }));

    const order = await this.orders.create({
      email: dto.email,
      items,
      shipping: dto.shipping as any,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      shippingAmount: totals.shippingAmount,
      total: totals.total,
      paymentMethod: dto.paymentMethod,
      paymentStatus: 'unpaid',
      status: dto.paymentMethod === 'cod' ? 'pending_confirmation' : 'pending',
    } as any);

    if (dto.paymentMethod === 'cod') {
      // COD: order sits in pending_confirmation; stock not yet decremented.
      // Admin confirms by WhatsApp/phone, then transitions to confirmed, which decrements.
      await this.mail.orderConfirmed(order);
      return { orderId: order._id, orderNumber: order.orderNumber, paymentMethod: 'cod', redirect: null };
    }

    const session = await this.payments.createSafepaySession(order);
    order.safepaySessionId = session.sessionId;
    await order.save();
    return {
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentMethod: 'safepay',
      redirect: session.redirectUrl,
    };
  }
}
