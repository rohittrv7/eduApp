import { IsOptional, IsString, IsBoolean, IsNumber, IsObject, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateSettingsDto {
  @IsOptional() @IsString() platformName?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() brandingColor?: string;
  @IsOptional() @IsString() contactEmail?: string;
  @IsOptional() @IsBoolean() maintenanceMode?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  referralRewardValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => Number(value))
  attendanceWarningThreshold?: number;

  @IsOptional()
  @IsObject()
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
  };

  @IsOptional()
  @IsObject()
  skillThresholds?: {
    basic?: number;
    intermediate?: number;
    advanced?: number;
    pro?: number;
  };
  // API keys / secrets intentionally excluded — must be set via env vars only
}
