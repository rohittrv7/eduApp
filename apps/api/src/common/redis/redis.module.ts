import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './redis.constants';

export { REDIS_CLIENT };

const logger = new Logger('RedisModule');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const url = process.env['REDIS_URL'];
        let client: Redis;
        if (url) {
          const isTls = url.startsWith('rediss://');
          client = new Redis(url, {
            maxRetriesPerRequest: 0,
            connectTimeout: 2000,
            lazyConnect: true,
            tls: isTls ? { rejectUnauthorized: false } : undefined,
            retryStrategy: () => null, // Stop retrying immediately if unreachable
            enableOfflineQueue: false,
          });
        } else {
          client = new Redis({
            host: config.get<string>('redis.host') ?? 'localhost',
            port: config.get<number>('redis.port') ?? 6379,
            password: config.get<string>('redis.password') || undefined,
            lazyConnect: true,
            connectTimeout: 2000,
            maxRetriesPerRequest: 0,
            retryStrategy: () => null,
            enableOfflineQueue: false,
          });
        }

        client.on('error', (err) => {
          logger.error(`❌ Redis Connection Error: ${err.message || err}`);
        });

        return client;
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
