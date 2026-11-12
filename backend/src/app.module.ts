import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { DiscountsModule } from './discounts/discounts.module';
import { AdminModule } from './admin/admin.module';
import { MailModule } from './mail/mail.module';
import { SettingsModule } from './settings/settings.module';
import { CheckoutModule } from './checkout/checkout.module';
import { HealthModule } from './health/health.module';

import { env } from './env';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(env.MONGODB_URI),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 120 },
      { name: 'auth', ttl: 60_000, limit: 10 },
    ]),
    ProductsModule,
    CartModule,
    OrdersModule,
    DiscountsModule,
    AdminModule,
    MailModule,
    SettingsModule,
    CheckoutModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
