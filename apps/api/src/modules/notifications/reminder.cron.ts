import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { LiveClass, LiveClassStatus } from '../live-classes/entities/live-class.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';
import { NotificationsService } from './notifications.service';

@Injectable()
export class ReminderCron {
  constructor(
    @InjectRepository(LiveClass)
    private readonly liveClassRepo: Repository<LiveClass>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('* * * * *') // every minute
  async sendLiveClassReminders(): Promise<void> {
    const now = new Date();
    const from = new Date(now.getTime() + 4 * 60 * 1000);
    const to = new Date(now.getTime() + 6 * 60 * 1000);

    const upcomingClasses = await this.liveClassRepo.find({
      where: {
        scheduled_at: Between(from, to),
        status: LiveClassStatus.APPROVED,
      },
    });

    for (const liveClass of upcomingClasses) {
      const enrollments = await this.enrollmentRepo.find({
        where: { batch_id: liveClass.batch_id, is_active: true },
      });

      for (const enrollment of enrollments) {
        await this.notificationsService.send(enrollment.student_id, {
          type: 'live_class_reminder',
          title: 'Live Class Starting Soon',
          body: `"${liveClass.title}" starts in 5 minutes`,
          deepLink: `/live-classes/${liveClass.id}`,
        });
      }
    }
  }
}
