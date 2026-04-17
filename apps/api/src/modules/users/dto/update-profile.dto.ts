import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LanguagePref } from '../entities/user.entity';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  classGrade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetExam?: string;

  @IsOptional()
  @IsEnum(LanguagePref)
  languagePref?: LanguagePref;

  @IsOptional()
  @IsDateString()
  examTargetDate?: string;

  @IsOptional()
  @IsBoolean()
  lowBandwidthMode?: boolean;
}
