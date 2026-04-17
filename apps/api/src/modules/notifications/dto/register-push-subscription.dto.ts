import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PushPlatform } from '../entities/push-subscription.entity';

export class RegisterPushSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @IsString()
  @IsNotEmpty()
  p256dh: string;

  @IsString()
  @IsNotEmpty()
  auth: string;

  @IsEnum(PushPlatform)
  platform: PushPlatform;
}
