import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { LanguagePref } from '../../users/entities/user.entity';

export class CreateRecordedVideoDto {
  @IsUUID()
  @IsNotEmpty()
  batch_id: string;

  @IsOptional()
  @IsUUID()
  chapter_id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  youtube_url: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration_seconds?: number;

  @IsOptional()
  @IsEnum(LanguagePref)
  language?: LanguagePref;

  @IsOptional()
  @IsBoolean()
  is_locked?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order_index?: number;
}
