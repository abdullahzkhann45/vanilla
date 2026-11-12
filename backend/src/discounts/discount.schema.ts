import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Discount {
  @Prop({ required: true, unique: true, index: true, uppercase: true }) code!: string;
  @Prop({ required: true, enum: ['percentage', 'fixed'] }) kind!: string;
  @Prop({ required: true, min: 0 }) value!: number;
  @Prop() expiresAt?: Date;
  @Prop({ min: 0 }) usageLimit?: number;
  @Prop({ default: 0 }) usageCount!: number;
  @Prop({ default: true }) isActive!: boolean;
}
export type DiscountDocument = HydratedDocument<Discount>;
export const DiscountSchema = SchemaFactory.createForClass(Discount);
