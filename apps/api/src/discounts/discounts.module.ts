import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Discount, DiscountSchema } from './discount.schema';
import { DiscountsService } from './discounts.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Discount.name, schema: DiscountSchema }])],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
