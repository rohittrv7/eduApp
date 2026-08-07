import {
  Body,
  Controller,
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
import { LiveClassesService } from './live-classes.service';
import { PlayTokenService } from '../videos/play-token.service';
import { CreateLiveClassDto } from './dto/create-live-class.dto';
import { RejectLiveClassDto } from './dto/reject-live-class.dto';
import { AttachRecordingDto } from './dto/attach-recording.dto';
import { LiveClassStatus } from './entities/live-class.entity';

/** Strip youtube_url from live class for students */
function sanitizeLiveClass(cls: any, role?: string) {
  if (!cls || role === 'teacher' || role === 'admin') return cls;
  const { youtube_url, youtube_video_id, ...safe } = cls;
  void youtube_url;
  void youtube_video_id;
  return safe;
}

@Controller('live-classes')
export class LiveClassesController {
  constructor(
    private readonly liveClassesService: LiveClassesService,
    private readonly playTokenService: PlayTokenService,
  ) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  create(@CurrentUser() user: any, @Body() dto: CreateLiveClassDto) {
    return this.liveClassesService.create(user.id, dto);
  }

  @Get('upcoming')
  @Roles(UserRole.STUDENT)
  findUpcoming(@CurrentUser() user: any) {
    return this.liveClassesService.findUpcoming(user.id);
  }

  @Get('mine')
  @Roles(UserRole.TEACHER)
  findMine(@CurrentUser() user: any) {
    return this.liveClassesService.findByTeacher(user.id);
  }

  @Get()
  findAll(@Query('batchId') batchId?: string, @Query('status') status?: LiveClassStatus) {
    return this.liveClassesService.findAll(batchId, status);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    const cls = await this.liveClassesService.findOne(id);
    return sanitizeLiveClass(cls, user?.role);
  }

  /**
   * POST /live-classes/:id/play-token
   * Issues a 4-hour JWT for a live class. Enrollment verified.
   */
  @Post(':id/play-token')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  issuePlayToken(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.playTokenService.issueLiveToken(id, user.id, user.role);
  }

  /**
   * POST /live-classes/:id/resolve-token
   * Validates token → returns { youtubeVideoId }. Never the full URL.
   */
  @Post(':id/resolve-token')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  resolvePlayToken(@Body('token') token: string) {
    return this.playTokenService.resolveToken(token, 'live');
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body()
    body: { scheduled_at?: string; title?: string; description?: string; youtube_url?: string },
  ) {
    return this.liveClassesService.updateLiveClass(id, user.id, user.role, body);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN)
  approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.liveClassesService.approve(id);
  }

  @Post(':id/reject')
  @Roles(UserRole.ADMIN)
  reject(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectLiveClassDto) {
    return this.liveClassesService.reject(id, dto.reason);
  }

  @Post(':id/go-live')
  @Roles(UserRole.TEACHER)
  goLive(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.liveClassesService.goLive(id, user.id);
  }

  @Post(':id/end')
  @Roles(UserRole.TEACHER)
  endLive(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.liveClassesService.endLive(id, user.id);
  }

  @Get(':id/viewer-count')
  getViewerCount(@Param('id', ParseUUIDPipe) id: string) {
    return this.liveClassesService.getViewerCount(id);
  }

  @Post(':id/join')
  @Roles(UserRole.STUDENT)
  join(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.liveClassesService.join(id, user.id);
  }

  @Get(':id/attendance')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  getAttendance(@Param('id', ParseUUIDPipe) id: string) {
    return this.liveClassesService.getAttendance(id);
  }

  @Post(':id/recording')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  attachRecording(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AttachRecordingDto) {
    return this.liveClassesService.attachRecording(id, dto.recording_url);
  }

  @Post(':id/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.TEACHER)
  deleteLiveClass(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.liveClassesService.deleteLiveClass(id, user.id);
  }
}
