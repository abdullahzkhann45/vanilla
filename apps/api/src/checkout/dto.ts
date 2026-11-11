import { IsEmail, IsEnum, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ShippingAddressDto {
  @IsString() fullName!: string;
  @Matches(/^\+?\d{10,15}$/) phone!: string;
  @IsString() line1!: string;
  @IsOptional() @IsString() line2?: string;
  @IsString() city!: string;
  @IsString() province!: string;
  @IsOptional() @IsString() postalCode?: string;
  @IsString() country!: string;
}

export class CheckoutSessionDto {
  @IsString() cartId!: string;
  @IsEmail() email!: string;
  @IsEnum(['cod', 'safepay']) paymentMethod!: 'cod' | 'safepay';
  @ValidateNested() @Type(() => ShippingAddressDto) shipping!: ShippingAddressDto;
}
