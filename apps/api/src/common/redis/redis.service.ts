import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private readonly memoryStore = new Map<string, { value: string; expiresAt?: number | undefined }>();

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async onModuleInit() {
    try {
      if (this.client.status !== 'ready' && this.client.status !== 'connecting') {
        await this.client.connect();
      }
      this.logger.log('✅ Redis connected successfully!');
    } catch (err: any) {
      const reason = err.message || err.code || String(err);
      this.logger.error(`❌ Redis connection failed! Reason: ${reason} (Falling back to in-memory store)`);
    }
  }

  private async execWithTimeout<T>(fn: () => Promise<T>, timeoutMs = 150): Promise<T | null> {
    if (this.client.status !== 'ready') return null;
    return new Promise<T | null>((resolve) => {
      let done = false;
      const t = setTimeout(() => {
        if (!done) { done = true; resolve(null); }
      }, timeoutMs);
      fn()
        .then((res) => { if (!done) { done = true; clearTimeout(t); resolve(res); } })
        .catch(() => { if (!done) { done = true; clearTimeout(t); resolve(null); } });
    });
  }

  async get(key: string): Promise<string | null> {
    const val = await this.execWithTimeout(() => this.client.get(key));
    if (val !== null) return val;

    const mem = this.memoryStore.get(key);
    if (mem) {
      if (mem.expiresAt && Date.now() > mem.expiresAt) {
        this.memoryStore.delete(key);
        return null;
      }
      return mem.value;
    }
    return null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds !== undefined ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryStore.set(key, { value, expiresAt });

    await this.execWithTimeout(() =>
      ttlSeconds !== undefined
        ? this.client.set(key, value, 'EX', ttlSeconds)
        : this.client.set(key, value),
    );
  }

  async del(key: string): Promise<void> {
    this.memoryStore.delete(key);
    await this.execWithTimeout(() => this.client.del(key));
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.execWithTimeout(() => this.client.expire(key, ttlSeconds));
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.execWithTimeout(() => this.client.hset(key, field, value));
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.execWithTimeout(() => this.client.hget(key, field));
  }
}
