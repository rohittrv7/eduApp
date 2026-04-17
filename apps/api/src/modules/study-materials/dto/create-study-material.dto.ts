import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { StudyMaterialType } from '../entities/study-material.entity';

export class CreateStudyMaterialDto {
  @IsOptional()
  @IsUUID()
  batch_id?: string;

  @IsOptional()
  @IsUUID()
  chapter_id?: string;

  @IsOptional()
  @IsUUID()
  video_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  folder_name?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsEnum(StudyMaterialType)
  type: StudyMaterialType;

  @IsOptional()
  @IsString()
  file_url?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  is_free_preview?: boolean;
}
