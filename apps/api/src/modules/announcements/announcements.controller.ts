import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  create(@CurrentUser() user: any, @Body() dto: CreateAnnouncementDto) {
    return this.announcementsService.create(user.id, dto);
  }

  /**
   * GET /announcements?batchId=xxx
   * Students can only see announcements for batches they are enrolled in.
   * Teachers/admins can see all.
   */
  @Get()
  findAll(@Query('batchId') batchId?: string, @CurrentUser() user?: any) {
    return this.announcementsService.findAll(batchId, user?.id, user?.role);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.announcementsService.markRead(id, user.id);
  }
}
