import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CartModule } from '../cart/cart.module';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [CartModule, OrdersModule, PaymentsModule, MailModule],
  controllers: [CheckoutController],
})
export class CheckoutModule {}
