import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { LiveClass, LiveClassStatus } from '../live-classes/entities/live-class.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';
import { NotificationsService } from './notifications.service';

@Injectable()
export class ReminderCron implements OnModuleInit {
  private readonly logger = new Logger(ReminderCron.name);

  constructor(
    @InjectRepository(LiveClass)
    private readonly liveClassRepo: Repository<LiveClass>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    private readonly notificationsService: NotificationsService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit(): Promise<void> {
    // Restore timers for all upcoming approved live classes on server startup
    try {
      const upcomingClasses = await this.liveClassRepo.find({
        where: {
          scheduled_at: MoreThan(new Date()),
          status: LiveClassStatus.APPROVED,
        },
      });

      for (const liveClass of upcomingClasses) {
        this.scheduleReminderForClass(liveClass);
      }
    } catch (err: any) {
      if (!err?.message?.includes('relation') && !err?.message?.includes('does not exist')) {
        this.logger.error('Error scheduling live class reminders on init:', err?.message || err);
      }
    }
  }

  scheduleReminderForClass(liveClass: LiveClass): void {
    const timerName = `live_class_reminder_${liveClass.id}`;

    // Remove existing timer if any
    if (this.schedulerRegistry.doesExist('timeout', timerName)) {
      this.schedulerRegistry.deleteTimeout(timerName);
    }

    const scheduledTime = new Date(liveClass.scheduled_at).getTime();
    const reminderTime = scheduledTime - 5 * 60 * 1000; // 5 minutes before class
    const delayMs = reminderTime - Date.now();

    if (delayMs <= 0) {
      return;
    }

    const timeout = setTimeout(async () => {
      await this.sendReminder(liveClass.id);
      if (this.schedulerRegistry.doesExist('timeout', timerName)) {
        this.schedulerRegistry.deleteTimeout(timerName);
      }
    }, delayMs);

    this.schedulerRegistry.addTimeout(timerName, timeout);
    this.logger.log(
      `Scheduled reminder for class "${liveClass.title}" in ${Math.round(delayMs / 1000)}s`,
    );
  }

  cancelReminderForClass(classId: string): void {
    const timerName = `live_class_reminder_${classId}`;
    if (this.schedulerRegistry.doesExist('timeout', timerName)) {
      this.schedulerRegistry.deleteTimeout(timerName);
      this.logger.log(`Cancelled reminder timer for class ${classId}`);
    }
  }

  private async sendReminder(classId: string): Promise<void> {
    try {
      const liveClass = await this.liveClassRepo.findOne({ where: { id: classId } });
      if (!liveClass || liveClass.status !== LiveClassStatus.APPROVED) return;

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
    } catch (err: any) {
      this.logger.error(`Error sending reminder for class ${classId}:`, err?.message || err);
    }
  }
}
