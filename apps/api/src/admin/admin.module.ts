import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AdminUser, AdminUserSchema } from './admin.schema';
import { AdminAuthService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { DiscountsModule } from '../discounts/discounts.module';
import { SettingsModule } from '../settings/settings.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AdminUser.name, schema: AdminUserSchema }]),
    JwtModule.register({}),
    ProductsModule,
    OrdersModule,
    DiscountsModule,
    SettingsModule,
    MailModule,
  ],
  providers: [AdminAuthService, AdminGuard],
  controllers: [AdminController],
  exports: [AdminAuthService],
})
export class AdminModule {}
