import { IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePayoutDto {
  @IsNumber()
  @Min(1, { message: 'Payout amount must be at least 1' })
  @Max(10000000, { message: 'Payout amount cannot exceed 10,000,000' })
  @Type(() => Number)
  amount!: number;
}
