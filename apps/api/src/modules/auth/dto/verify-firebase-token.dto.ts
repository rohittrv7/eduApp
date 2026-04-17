import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyFirebaseTokenDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
