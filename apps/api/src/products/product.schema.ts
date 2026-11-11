import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: true })
export class Variant {
  @Prop({ required: true, unique: true }) sku!: string;
  @Prop({ required: true, enum: ['S', 'M', 'L', 'XL'] }) size!: string;
  @Prop({ required: true }) colour!: string;
  @Prop({ required: true, min: 0 }) price!: number; // paisa
  @Prop({ required: true, min: 0, default: 0 }) stock!: number;
  @Prop({ default: true }) isActive!: boolean;
}
const VariantSchema = SchemaFactory.createForClass(Variant);

@Schema()
export class Image {
  @Prop({ required: true }) url!: string;
  @Prop({ default: '' }) alt!: string;
  @Prop({ default: 0 }) order!: number;
}
const ImageSchema = SchemaFactory.createForClass(Image);

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Product {
  @Prop({ required: true, unique: true, index: true }) slug!: string;
  @Prop({ required: true }) name!: string;
  @Prop({ required: true, enum: ['sweatshirt', 'sweatpants'], index: true }) type!: string;
  @Prop({ required: true }) description!: string;
  @Prop({ required: true }) fabric!: string;
  @Prop({ required: true }) care!: string;
  @Prop({ required: true, min: 0 }) basePrice!: number; // paisa
  @Prop({ default: 'PKR' }) currency!: string;
  @Prop({ type: [ImageSchema], default: [] }) images!: Image[];
  @Prop({ type: [VariantSchema], default: [] }) variants!: Variant[];
  @Prop({ default: true, index: true }) isPublished!: boolean;
}

export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ slug: 1 }, { unique: true });
