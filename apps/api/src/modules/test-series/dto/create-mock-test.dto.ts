import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MockTestQuestionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsArray()
  options: object[];

  @IsString()
  @IsNotEmpty()
  correct_answer: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  marks?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  negative_marks?: number;
}

export class CreateMockTestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subject?: string;

  @IsNumber()
  @Min(1)
  duration_mins: number;

  @IsNumber()
  @Min(0)
  total_marks: number;

  @IsOptional()
  questions?: MockTestQuestionDto[];
}
