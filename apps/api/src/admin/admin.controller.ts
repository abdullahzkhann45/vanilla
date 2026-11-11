import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AdminGuard } from './admin.guard';
import { AdminAuthService } from './admin.service';
import { ProductsService } from '../products/products.service';
import { OrdersService } from '../orders/orders.service';
import { DiscountsService } from '../discounts/discounts.service';
import { SettingsService } from '../settings/settings.service';
import { MailService } from '../mail/mail.service';

class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
}

@Controller('admin')
export class AdminController {
  constructor(
    private auth: AdminAuthService,
    private products: ProductsService,
    private orders: OrdersService,
    private discounts: DiscountsService,
    private settings: SettingsService,
    private mail: MailService,
  ) {}

  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @Post('auth/login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const r = await this.auth.login(dto.email, dto.password);
    res.cookie('vnl_refresh', r.refresh, {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 3600 * 1000,
    });
    return { token: r.token, email: r.email };
  }

  // ---- Products ----
  @UseGuards(AdminGuard) @Get('products')
  listProducts() { return this.products.listAll(); }

  @UseGuards(AdminGuard) @Post('products')
  createProduct(@Body() body: any) { return this.products.create(body); }

  @UseGuards(AdminGuard) @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: any) { return this.products.update(id, body); }

  @UseGuards(AdminGuard) @Delete('products/:id')
  removeProduct(@Param('id') id: string) { return this.products.remove(id); }

  // ---- Orders ----
  @UseGuards(AdminGuard) @Get('orders')
  listOrders(@Query('status') status?: string) {
    return this.orders.list(status ? { status } : {});
  }

  @UseGuards(AdminGuard) @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    return (await this.orders['model'].findById(id))?.toObject();
  }

  @UseGuards(AdminGuard) @Patch('orders/:id/status')
  async setStatus(@Param('id') id: string, @Body() body: { status: string }) {
    const o = await this.orders['model'].findById(id);
    if (!o) return null;
    // COD confirm triggers stock decrement
    if (body.status === 'confirmed' && o.status !== 'confirmed') {
      await this.orders.confirmAndDecrementStock(o);
    } else {
      o.status = body.status;
      await o.save();
    }
    return o.toObject();
  }

  @UseGuards(AdminGuard) @Patch('orders/:id/tracking')
  async setTracking(@Param('id') id: string, @Body() body: { trackingNumber: string }) {
    const o = await this.orders.setTracking(id, body.trackingNumber);
    if (o) await this.mail.orderShipped(o);
    return o?.toObject();
  }

  // ---- Discounts ----
  @UseGuards(AdminGuard) @Get('discounts')
  listDiscounts() { return this.discounts.list(); }

  @UseGuards(AdminGuard) @Post('discounts')
  createDiscount(@Body() body: any) { return this.discounts.create(body); }

  @UseGuards(AdminGuard) @Patch('discounts/:id')
  updateDiscount(@Param('id') id: string, @Body() body: any) { return this.discounts.update(id, body); }

  @UseGuards(AdminGuard) @Delete('discounts/:id')
  removeDiscount(@Param('id') id: string) { return this.discounts.remove(id); }

  // ---- Settings ----
  @UseGuards(AdminGuard) @Get('settings')
  getSettings() { return this.settings.get(); }

  @UseGuards(AdminGuard) @Patch('settings')
  updateSettings(@Body() body: any) { return this.settings.update(body); }
}
