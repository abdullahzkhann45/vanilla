import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query('type') type?: string) {
    return this.products.listPublished(type);
  }

  @Get(':slug')
  one(@Param('slug') slug: string) {
    return this.products.getBySlug(slug);
  }
}
