import { IsNotEmpty, IsString } from 'class-validator';

export class AttachRecordingDto {
  @IsString()
  @IsNotEmpty()
  recording_url: string;
}
