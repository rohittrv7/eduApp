import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async get(key: string): Promise<string | null> {
    try { return await this.client.get(key); }
    catch { return null; }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds !== undefined) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (e) {
      this.logger.warn(`Redis set failed for key ${key}: ${e}`);
    }
  }

  async del(key: string): Promise<void> {
    try { await this.client.del(key); }
    catch { /* ignore */ }
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    try { await this.client.expire(key, ttlSeconds); }
    catch { /* ignore */ }
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    try { await this.client.hset(key, field, value); }
    catch { /* ignore */ }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try { return await this.client.hget(key, field); }
    catch { return null; }
  }
}
