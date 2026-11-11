import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Settings {
  @Prop({ required: true, default: 20000 }) flatShippingRate!: number; // 200 PKR
  @Prop({ required: true, default: 500000 }) freeShippingThreshold!: number; // 5000 PKR
  @Prop({ required: true, default: 'orders@vanilla.pk' }) storeEmail!: string;
  @Prop({ default: false }) maintenanceMode!: boolean;
  @Prop({ required: true, default: 1000000 }) codMaxAutoApprove!: number; // 10 000 PKR
}
export type SettingsDocument = HydratedDocument<Settings>;
export const SettingsSchema = SchemaFactory.createForClass(Settings);
