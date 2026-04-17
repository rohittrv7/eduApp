import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDoubtDto {
  @IsOptional()
  @IsUUID()
  video_id?: string;

  @IsOptional()
  @IsUUID()
  chapter_id?: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}
