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
import { CreateRecordedVideoDto } from './dto/create-recorded-video.dto';
import { UpdateRecordedVideoDto } from './dto/update-recorded-video.dto';
import { UpsertWatchSessionDto } from './dto/upsert-watch-session.dto';

@Controller('videos')
export class RecordedVideosController {
  constructor(
    private readonly videosService: RecordedVideosService,
    private readonly watchSessionsService: WatchSessionsService,
    private readonly downloadTokenService: DownloadTokenService,
  ) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  create(@CurrentUser() user: any, @Body() dto: CreateRecordedVideoDto) {
    return this.videosService.create(user.id, dto);
  }

  @Get()
  findAll(@Query('batchId') batchId?: string) {
    return this.videosService.findAll(batchId);
  }

  @Get('watch-sessions/recent')
  @Roles(UserRole.STUDENT)
  getRecentWatchSessions(@CurrentUser() user: any) {
    return this.watchSessionsService.getRecentSessions(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.videosService.findOne(id, user?.id, user?.role);
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
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
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

  @Get(':id/watch-session')
  @Roles(UserRole.STUDENT)
  getWatchSession(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
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
  issueDownloadToken(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
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
