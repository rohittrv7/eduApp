import { IsOptional, IsString } from 'class-validator';

export class RejectLiveClassDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
