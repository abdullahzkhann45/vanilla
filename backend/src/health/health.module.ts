import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminGuard } from '../admin/admin.guard';

@Module({
  imports: [ProductsModule, OrdersModule, NotificationsModule, JwtModule.register({})],
  providers: [HealthService, AdminGuard],
  controllers: [HealthController],
})
export class HealthModule {}
