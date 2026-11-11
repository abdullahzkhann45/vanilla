import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CartService } from './cart.service';
import { ApplyDiscountDto, UpdateCartDto } from './dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Post()
  async create() {
    const c = await this.cart.create();
    return { id: c._id, lines: c.lines };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.cart.priceCart(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCartDto) {
    await this.cart.update(id, dto as any);
    return this.cart.priceCart(id);
  }

  @Post(':id/discount')
  async discount(@Param('id') id: string, @Body() dto: ApplyDiscountDto) {
    await this.cart.applyDiscount(id, dto.code);
    return this.cart.priceCart(id);
  }
}
