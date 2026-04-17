import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordedVideo } from './entities/recorded-video.entity';
import { WatchSession } from './entities/watch-session.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';
import { User } from '../users/entities/user.entity';
import { RecordedVideosService } from './recorded-videos.service';
import { RecordedVideosController } from './recorded-videos.controller';
import { WatchSessionsService } from './watch-sessions.service';
import { DownloadTokenService } from './download-token.service';

@Module({
  imports: [TypeOrmModule.forFeature([RecordedVideo, WatchSession, Enrollment, User])],
  controllers: [RecordedVideosController],
  providers: [RecordedVideosService, WatchSessionsService, DownloadTokenService],
  exports: [RecordedVideosService, WatchSessionsService, DownloadTokenService],
})
export class VideosModule {}
