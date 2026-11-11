import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema()
export class CartLine {
  @Prop({ required: true }) productId!: string;
  @Prop({ required: true }) variantSku!: string;
  @Prop({ required: true, min: 1, max: 20 }) quantity!: number;
}
const CartLineSchema = SchemaFactory.createForClass(CartLine);

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: [CartLineSchema], default: [] }) lines!: CartLine[];
  @Prop() discountCode?: string;
  @Prop({ default: () => new Date() }) updatedAt!: Date;
}
export type CartDocument = HydratedDocument<Cart>;
export const CartSchema = SchemaFactory.createForClass(Cart);
// 30-day TTL per PRD
CartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
