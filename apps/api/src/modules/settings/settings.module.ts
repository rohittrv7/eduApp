import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformSetting } from './entities/platform-setting.entity';
import { SettingsService } from './settings.service';
import { SettingsController, MaintenanceController } from './settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlatformSetting])],
  controllers: [SettingsController, MaintenanceController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
