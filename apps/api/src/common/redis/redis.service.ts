import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

interface MemEntry {
  value: string;
  expiresAt: number | null;
}

/**
 * RedisService with in-memory fallback.
 * When Redis is unavailable (e.g. local dev without Redis),
 * all operations fall back to a local Map so OTP flow still works.
 */
@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly memStore = new Map<string, MemEntry>();
  private redisAvailable = true;

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {
    // Monitor connection status
    this.client.on('ready', () => {
      this.redisAvailable = true;
      this.logger.log('Redis connected');
    });
    this.client.on('error', () => {
      this.redisAvailable = false;
    });
    this.client.on('close', () => {
      this.redisAvailable = false;
    });
  }

  // ─── Memory fallback helpers ───────────────────────────────────────────────

  private memGet(key: string): string | null {
    const entry = this.memStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.memStore.delete(key);
      return null;
    }
    return entry.value;
  }

  private memSet(key: string, value: string, ttlSeconds?: number): void {
    this.memStore.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  private memDel(key: string): void {
    this.memStore.delete(key);
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  async get(key: string): Promise<string | null> {
    if (!this.redisAvailable) return this.memGet(key);
    try {
      return await this.client.get(key);
    } catch {
      this.redisAvailable = false;
      return this.memGet(key);
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.redisAvailable) {
      this.memSet(key, value, ttlSeconds);
      return;
    }
    try {
      if (ttlSeconds !== undefined) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (e) {
      this.logger.warn(`Redis set failed for key ${key}, using in-memory fallback: ${e}`);
      this.redisAvailable = false;
      this.memSet(key, value, ttlSeconds);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redisAvailable) {
      this.memDel(key);
      return;
    }
    try {
      await this.client.del(key);
    } catch {
      this.memDel(key);
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (!this.redisAvailable) return;
    try { await this.client.expire(key, ttlSeconds); }
    catch { /* ignore */ }
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    if (!this.redisAvailable) return;
    try { await this.client.hset(key, field, value); }
    catch { /* ignore */ }
  }

  async hget(key: string, field: string): Promise<string | null> {
    if (!this.redisAvailable) return null;
    try { return await this.client.hget(key, field); }
    catch { return null; }
  }
}
