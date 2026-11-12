import { Controller, Get, Param, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  // Guest lookup: /orders/VNL-XXXX?email=foo@bar.com
  @Get(':number')
  async get(@Param('number') number: string, @Query('email') email: string) {
    const order = await this.orders.getForGuest(number, email || '');
    return order.toObject();
  }
}
