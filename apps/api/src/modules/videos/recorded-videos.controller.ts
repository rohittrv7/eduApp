import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RecordedVideosService } from './recorded-videos.service';
import { WatchSessionsService } from './watch-sessions.service';
import { DownloadTokenService } from './download-token.service';
import { PlayTokenService } from './play-token.service';
import { CreateRecordedVideoDto } from './dto/create-recorded-video.dto';
import { UpdateRecordedVideoDto } from './dto/update-recorded-video.dto';
import { UpsertWatchSessionDto } from './dto/upsert-watch-session.dto';

/** Strip sensitive YouTube fields from video response for students */
function sanitizeVideo(video: any, role?: string) {
  if (!video) return video;
  if (role === 'teacher' || role === 'admin') return video;
  const { youtube_url, ...safe } = video;
  void youtube_url; // suppress unused var lint
  return safe;
}

@Controller('videos')
export class RecordedVideosController {
  constructor(
    private readonly videosService: RecordedVideosService,
    private readonly watchSessionsService: WatchSessionsService,
    private readonly downloadTokenService: DownloadTokenService,
    private readonly playTokenService: PlayTokenService,
  ) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  create(@CurrentUser() user: any, @Body() dto: CreateRecordedVideoDto) {
    return this.videosService.create(user.id, dto);
  }

  @Get()
  async findAll(@Query('batchId') batchId?: string, @CurrentUser() user?: any) {
    const videos = await this.videosService.findAll(batchId);
    return videos.map((v) => sanitizeVideo(v, user?.role));
  }

  @Get('watch-sessions/recent')
  @Roles(UserRole.STUDENT)
  getRecentWatchSessions(@CurrentUser() user: any) {
    return this.watchSessionsService.getRecentSessions(user.id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    const video = await this.videosService.findOne(id, user?.id, user?.role);
    // Strip youtube_url for students — they use play-token instead
    return sanitizeVideo(video, user?.role);
  }

  /**
   * POST /videos/:id/play-token
   * Issues a 4-hour JWT that lets the student resolve the YouTube video ID.
   * Enrollment is verified here. The token binds userId + videoId.
   */
  @Post(':id/play-token')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  issuePlayToken(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.playTokenService.issueVideoToken(id, user.id, user.role);
  }

  /**
   * POST /videos/:id/resolve-token
   * Validates the JWT and returns { youtubeVideoId } — never the full URL.
   * Body: { token: string }
   */
  @Post(':id/resolve-token')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  resolvePlayToken(@Body('token') token: string) {
    return this.playTokenService.resolveToken(token, 'video');
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateRecordedVideoDto,
  ) {
    return this.videosService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.videosService.remove(id, user.id, user.role);
  }

  @Post(':id/watch-session')
  @Roles(UserRole.STUDENT)
  upsertWatchSession(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: UpsertWatchSessionDto,
  ) {
    return this.watchSessionsService.upsertWatchSession(user.id, id, dto);
  }

  @Post(':id/progress')
  @Roles(UserRole.STUDENT)
  saveProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: { position: number; duration?: number; watchTimeSecs?: number },
  ) {
    return this.watchSessionsService.upsertWatchSession(user.id, id, {
      watch_time_secs: dto.watchTimeSecs ?? 10,
      last_position: dto.position ?? 0,
      duration_seconds: dto.duration,
    });
  }

  @Get(':id/watch-session')
  @Roles(UserRole.STUDENT)
  getWatchSession(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.watchSessionsService.getWatchSession(user.id, id);
  }

  @Get(':id/quiz-unlock-status')
  @Roles(UserRole.STUDENT)
  async getQuizUnlockStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Query('threshold') threshold?: string,
  ) {
    const unlockThreshold = threshold ? parseFloat(threshold) : 90;
    return this.watchSessionsService.getQuizUnlockStatus(user.id, id, unlockThreshold);
  }

  /**
   * POST /videos/:id/download-token
   * Issues a signed download token for offline encrypted storage.
   * Only works when VIDEO_PROVIDER !== 'youtube'.
   * Returns 403 if provider is YouTube or student is not enrolled.
   */
  @Post(':id/download-token')
  @Roles(UserRole.STUDENT)
  issueDownloadToken(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.downloadTokenService.issueToken(id, user.id);
  }

  /**
   * GET /videos/provider
   * Returns current VIDEO_PROVIDER so frontend can gate download UI.
   * Public — no auth needed (just a config value).
   */
  @Get('config/provider')
  getVideoProvider() {
    return { provider: this.downloadTokenService.videoProvider };
  }
}
