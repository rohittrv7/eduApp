import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SettingsService } from './settings.service';

@Controller('admin/settings')
@Roles(UserRole.ADMIN)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getAll() {
    return this.settingsService.getAll();
  }

  @Patch()
  update(@Body() body: Record<string, string>) {
    return this.settingsService.update(body);
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
