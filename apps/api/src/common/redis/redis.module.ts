import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './redis.constants';

export { REDIS_CLIENT };

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const url = process.env['REDIS_URL'];
        if (url) {
          const isTls = url.startsWith('rediss://');
          const client = new Redis(url, {
            maxRetriesPerRequest: 3,
            tls: isTls ? { rejectUnauthorized: false } : undefined,
            retryStrategy: (times) => {
              if (times > 5) return null;
              return Math.min(times * 500, 3000);
            },
            enableOfflineQueue: false,
            connectTimeout: 10000,
          });
          // Suppress unhandled error events — app continues without Redis
          client.on('error', (err) => {
            const logger = new (require('@nestjs/common').Logger)('RedisClient');
            logger.warn(`Redis connection error: ${err?.message}`);
          });
          return client;
        }
        return new Redis({
          host: config.get<string>('redis.host') ?? 'localhost',
          port: config.get<number>('redis.port') ?? 6379,
          password: config.get<string>('redis.password') || undefined,
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 5) return null;
            return Math.min(times * 500, 3000);
          },
          enableOfflineQueue: false,
          connectTimeout: 10000,
        });
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
