import { IsEmail } from 'class-validator';

export class RequestEmailOtpDto {
  @IsEmail()
  email: string;
}
