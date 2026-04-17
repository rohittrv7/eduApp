import { IsNotEmpty, IsObject } from 'class-validator';

export class SubmitAttemptDto {
  @IsObject()
  @IsNotEmpty()
  answers: Record<string, string>;
}
