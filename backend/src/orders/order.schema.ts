import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class OrderItem {
  @Prop({ required: true }) productId!: string;
  @Prop({ required: true }) productSlug!: string;
  @Prop({ required: true }) productName!: string;
  @Prop({ required: true }) variantSku!: string;
  @Prop({ required: true }) size!: string;
  @Prop({ required: true }) colour!: string;
  @Prop({ required: true }) unitPrice!: number; // paisa, snapshot
  @Prop({ required: true }) quantity!: number;
  @Prop({ required: true }) imageUrl!: string;
}
const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class ShippingAddress {
  @Prop({ required: true }) fullName!: string;
  @Prop({ required: true }) phone!: string;
  @Prop({ required: true }) line1!: string;
  @Prop() line2?: string;
  @Prop({ required: true }) city!: string;
  @Prop({ required: true }) province!: string;
  @Prop() postalCode?: string;
  @Prop({ required: true, default: 'PK' }) country!: string;
}
const ShippingAddressSchema = SchemaFactory.createForClass(ShippingAddress);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true, index: true }) orderNumber!: string;
  @Prop({ required: true, index: true }) email!: string;
  @Prop({ type: [OrderItemSchema], required: true }) items!: OrderItem[];
  @Prop({ type: ShippingAddressSchema, required: true }) shipping!: ShippingAddress;

  @Prop({ required: true }) subtotal!: number;
  @Prop({ required: true, default: 0 }) discountAmount!: number;
  @Prop({ required: true }) shippingAmount!: number;
  @Prop({ required: true }) total!: number;
  @Prop({ required: true, default: 'PKR' }) currency!: string;
  @Prop() discountCode?: string;

  @Prop({ required: true, enum: ['cod'], default: 'cod' }) paymentMethod!: string;
  @Prop({ required: true, enum: ['unpaid', 'paid', 'refunded', 'failed'], default: 'unpaid' })
  paymentStatus!: string;

  @Prop({
    required: true,
    enum: [
      'pending',
      'pending_confirmation',
      'confirmed',
      'packed',
      'shipped',
      'delivered',
      'cancelled',
      'returned',
    ],
    default: 'pending',
    index: true,
  })
  status!: string;

  @Prop() trackingNumber?: string;
  @Prop({ default: false }) codPhoneVerified?: boolean;
}

export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);
