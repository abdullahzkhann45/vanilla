import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class AdminUser {
  @Prop({ required: true, unique: true, lowercase: true }) email!: string;
  @Prop({ required: true }) passwordHash!: string;
  @Prop({ default: 'admin' }) role!: string;
}
export type AdminUserDocument = HydratedDocument<AdminUser>;
export const AdminUserSchema = SchemaFactory.createForClass(AdminUser);
