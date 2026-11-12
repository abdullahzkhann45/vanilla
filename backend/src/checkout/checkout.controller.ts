import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CartService } from '../cart/cart.service';
import { OrdersService } from '../orders/orders.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CheckoutSessionDto } from './dto';

@Controller('checkout')
export class CheckoutController {
  constructor(
    private cart: CartService,
    private orders: OrdersService,
    private mail: MailService,
    private notifications: NotificationsService,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('session')
  async session(@Body() dto: CheckoutSessionDto) {
    const totals = await this.cart.priceCart(dto.cartId);

    if (!totals.lines.length) throw new BadRequestException('Cart is empty');
    for (const l of totals.lines) {
      if (!l.inStock) throw new BadRequestException(`Sold out: ${l.productName} / ${l.size} / ${l.colour}`);
    }
    if (totals.total <= 0) throw new BadRequestException('Invalid order total');

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
      paymentMethod: 'cod',
      paymentStatus: 'unpaid',
      status: 'pending_confirmation',
    } as any);

    await this.mail.orderConfirmed(order);
    // Fire-and-forget: never block or fail the order on a notification.
    void this.notifications.newOrder(order);
    return { orderId: order._id, orderNumber: order.orderNumber, paymentMethod: 'cod' };
  }
}
