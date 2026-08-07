import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from '../admin/dto/update-settings.dto';

const SENSITIVE_SETTINGS_KEYS = [
  'smsApiKey',
  'fcmServerKey',
  'razorpayKeyId',
  'razorpayWebhookSecret',
  'razorpayKeySecret',
  'imagekitPrivateKey',
  'cloudinaryApiSecret',
  'secret',
  'password',
  'key',
];

@Controller('admin/settings')
@Roles(UserRole.ADMIN)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getAll() {
    const settings = await this.settingsService.getAll();
    return settings.map((s) => ({
      ...s,
      value: SENSITIVE_SETTINGS_KEYS.some((k) => s.key.toLowerCase().includes(k.toLowerCase()))
        ? s.value
          ? '••••••••'
          : ''
        : s.value,
    }));
  }

  @Patch()
  async update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto as any);
  }
}

@Controller('admin/maintenance')
@Roles(UserRole.ADMIN)
export class MaintenanceController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  toggleMaintenance(@Body() body: { enabled: boolean }) {
    return this.settingsService.toggleMaintenance(body.enabled);
  }
}
