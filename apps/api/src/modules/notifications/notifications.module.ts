import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { User } from '../users/entities/user.entity';
import { LiveClass } from '../live-classes/entities/live-class.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { ReminderCron } from './reminder.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationPreference,
      PushSubscription,
      User,
      LiveClass,
      Enrollment,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, ReminderCron],
  exports: [NotificationsService, ReminderCron],
})
export class NotificationsModule {}
