import { IsArray, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CartLineDto {
  @IsString() productId!: string;
  @IsString() variantSku!: string;
  @IsInt() @Min(1) @Max(20) quantity!: number;
}

export class UpdateCartDto {
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CartLineDto)
  lines?: CartLineDto[];
  @IsOptional() @IsString() discountCode?: string;
}

export class ApplyDiscountDto {
  @IsString() code!: string;
}
