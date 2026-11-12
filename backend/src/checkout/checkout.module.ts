import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CartModule } from '../cart/cart.module';
import { OrdersModule } from '../orders/orders.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [CartModule, OrdersModule, MailModule, NotificationsModule],
  controllers: [CheckoutController],
})
export class CheckoutModule {}
