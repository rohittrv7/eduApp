import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { RecordedVideo } from './entities/recorded-video.entity';
import { WatchSession } from './entities/watch-session.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';
import { User } from '../users/entities/user.entity';
import { LiveClass } from '../live-classes/entities/live-class.entity';
import { RecordedVideosService } from './recorded-videos.service';
import { RecordedVideosController } from './recorded-videos.controller';
import { WatchSessionsService } from './watch-sessions.service';
import { DownloadTokenService } from './download-token.service';
import { PlayTokenService } from './play-token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecordedVideo, WatchSession, Enrollment, User, LiveClass]),
    JwtModule.register({}), // secrets passed per-call via jwtService.sign options
  ],
  controllers: [RecordedVideosController],
  providers: [RecordedVideosService, WatchSessionsService, DownloadTokenService, PlayTokenService],
  exports: [RecordedVideosService, WatchSessionsService, DownloadTokenService, PlayTokenService],
})
export class VideosModule {}
