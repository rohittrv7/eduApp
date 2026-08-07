import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveClass } from './entities/live-class.entity';
import { Attendance } from './entities/attendance.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';
import { RecordedVideo } from '../videos/entities/recorded-video.entity';
import { LiveClassesService } from './live-classes.service';
import { LiveClassesController } from './live-classes.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { VideosModule } from '../videos/videos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LiveClass, Attendance, Enrollment, RecordedVideo]),
    NotificationsModule,
    VideosModule, // provides PlayTokenService
  ],
  controllers: [LiveClassesController],
  providers: [LiveClassesService],
  exports: [LiveClassesService],
})
export class LiveClassesModule {}
