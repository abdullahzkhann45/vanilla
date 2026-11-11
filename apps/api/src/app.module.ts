import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { DiscountsModule } from './discounts/discounts.module';
import { AdminModule } from './admin/admin.module';
import { MailModule } from './mail/mail.module';
import { SettingsModule } from './settings/settings.module';
import { CheckoutModule } from './checkout/checkout.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vanilla'),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 120 },
      { name: 'auth', ttl: 60_000, limit: 10 },
    ]),
    ProductsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    DiscountsModule,
    AdminModule,
    MailModule,
    SettingsModule,
    CheckoutModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
