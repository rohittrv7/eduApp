import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { RedisModule } from './common/redis/redis.module';
import { StorageModule } from './common/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ContentModule } from './modules/content/content.module';
import { BatchesModule } from './modules/batches/batches.module';
import { VideosModule } from './modules/videos/videos.module';
import { StudyMaterialsModule } from './modules/study-materials/study-materials.module';
import { LiveClassesModule } from './modules/live-classes/live-classes.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { TestSeriesModule } from './modules/test-series/test-series.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SocketModule } from './modules/socket/socket.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { SettingsModule } from './modules/settings/settings.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { DoubtsModule } from './modules/doubts/doubts.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { JwtStrategy } from './common/strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds in ms
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.getOrThrow<string>('database.host'),
        port: config.getOrThrow<number>('database.port'),
        username: config.getOrThrow<string>('database.username'),
        password: config.getOrThrow<string>('database.password'),
        database: config.getOrThrow<string>('database.name'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize:
          process.env['DB_SYNCHRONIZE'] === 'true' && process.env['NODE_ENV'] === 'development',
        poolSize: 15,
        ssl: { rejectUnauthorized: false },
        extra: {
          max: 15,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 3000,
        },
      }),
    }),
    RedisModule,
    StorageModule,
    AuthModule,
    UsersModule,
    ContentModule,
    BatchesModule,
    VideosModule,
    StudyMaterialsModule,
    LiveClassesModule,
    QuizzesModule,
    TestSeriesModule,
    LeaderboardModule,
    PaymentsModule,
    SocketModule,
    NotificationsModule,
    AdminModule,
    SettingsModule,
    CertificatesModule,
    DoubtsModule,
    AnnouncementsModule,
  ],
  controllers: [],
  providers: [
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger('Database');

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      if (this.dataSource.isInitialized) {
        this.logger.log('✅ Database (PostgreSQL) connected successfully!');
      } else {
        this.logger.error('❌ Database (PostgreSQL) connection is not initialized!');
      }
    } catch (err: any) {
      const reason = err.message || err.code || String(err);
      this.logger.error(`❌ Database (PostgreSQL) connection failed! Reason: ${reason}`);
    }
  }
}
