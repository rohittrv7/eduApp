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
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { NotificationsService } from './notifications.service';
import { RegisterPushSubscriptionDto } from './dto/register-push-subscription.dto';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('users/me/push-subscription')
  registerPushSubscription(
    @CurrentUser() user: any,
    @Body() dto: RegisterPushSubscriptionDto,
  ) {
    return this.notificationsService.registerPushSubscription(user.id, dto);
  }

  @Get('notifications')
  getNotifications(@CurrentUser() user: any) {
    return this.notificationsService.getNotifications(user.id);
  }

  @Get('notifications/unread')
  getUnreadNotifications(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadNotifications(user.id);
  }

  @Patch('notifications/:id/read')
  markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.markRead(id, user.id);
  }

  @Patch('notifications/read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  markAllRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Post('notifications/broadcast')
  @Roles(UserRole.ADMIN)
  broadcast(@Body() dto: BroadcastNotificationDto) {
    return this.notificationsService.broadcast(
      { type: dto.type ?? 'broadcast', title: dto.title, body: dto.body },
      dto.batch_id,
    );
  }
}
