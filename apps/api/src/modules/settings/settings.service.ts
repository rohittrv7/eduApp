import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSetting } from './entities/platform-setting.entity';

const MAINTENANCE_KEY = 'maintenance_mode';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(PlatformSetting)
    private readonly settingRepo: Repository<PlatformSetting>,
  ) {}

  async getAll(): Promise<PlatformSetting[]> {
    return this.settingRepo.find();
  }

  async update(settings: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await this.settingRepo.upsert({ key, value }, ['key']);
    }
  }

  async get(key: string): Promise<string | null> {
    const setting = await this.settingRepo.findOne({ where: { key } });
    return setting?.value ?? null;
  }

  async toggleMaintenance(enabled: boolean): Promise<void> {
    await this.settingRepo.upsert(
      { key: MAINTENANCE_KEY, value: enabled ? 'true' : 'false' },
      ['key'],
    );
  }

  async isMaintenanceMode(): Promise<boolean> {
    const value = await this.get(MAINTENANCE_KEY);
    return value === 'true';
  }
}
