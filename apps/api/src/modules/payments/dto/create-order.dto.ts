import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  batch_id: string;

  @IsOptional()
  @IsString()
  coupon_code?: string;
}
