import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { PushSubscription, PushPlatform } from './entities/push-subscription.entity';
import { User } from '../users/entities/user.entity';
import { RegisterPushSubscriptionDto } from './dto/register-push-subscription.dto';

@Injectable()
export class NotificationsService {
  private readonly vapidPublicKey: string;
  private readonly vapidPrivateKey: string;
  private readonly fcmServerKey: string;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private readonly prefRepo: Repository<NotificationPreference>,
    @InjectRepository(PushSubscription)
    private readonly pushSubRepo: Repository<PushSubscription>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    this.vapidPublicKey = this.configService.get<string>('vapid.publicKey') ?? '';
    this.vapidPrivateKey = this.configService.get<string>('vapid.privateKey') ?? '';
    this.fcmServerKey = this.configService.get<string>('fcm.serverKey') ?? '';
  }

  async registerPushSubscription(
    userId: string,
    dto: RegisterPushSubscriptionDto,
  ): Promise<PushSubscription> {
    const existing = await this.pushSubRepo.findOne({
      where: { user_id: userId, endpoint: dto.endpoint },
    });
    if (existing) {
      existing.p256dh = dto.p256dh;
      existing.auth = dto.auth;
      existing.platform = dto.platform;
      return this.pushSubRepo.save(existing);
    }
    const sub = this.pushSubRepo.create({
      user_id: userId,
      endpoint: dto.endpoint,
      p256dh: dto.p256dh,
      auth: dto.auth,
      platform: dto.platform,
    });
    return this.pushSubRepo.save(sub);
  }

  async send(
    userId: string,
    payload: { type: string; title: string; body: string; deepLink?: string },
    bypassPreferences = false,
  ): Promise<void> {
    if (!bypassPreferences) {
      const pref = await this.prefRepo.findOne({ where: { user_id: userId } });
      if (pref) {
        const typeMap: Record<string, keyof NotificationPreference> = {
          live_class_reminder: 'live_class_reminders',
          doubt_reply: 'doubt_replies',
          announcement: 'new_announcements',
          quiz_result: 'quiz_results',
          leaderboard: 'leaderboard_updates',
          new_batch: 'new_batch_launches',
        };
        const prefKey = typeMap[payload.type];
        if (prefKey && pref[prefKey] === false) return;
      }
    }

    // Persist notification
    const notification = this.notificationRepo.create({
      user_id: userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      deep_link: payload.deepLink ?? null,
    });
    await this.notificationRepo.save(notification);

    // Send push
    const subscriptions = await this.pushSubRepo.find({ where: { user_id: userId } });
    for (const sub of subscriptions) {
      try {
        if (sub.platform === PushPlatform.WEB) {
          await this.sendWebPush(sub, payload);
        } else if (sub.platform === PushPlatform.ANDROID) {
          await this.sendFcm(sub.endpoint, payload);
        }
      } catch {
        // ignore individual push failures
      }
    }
  }

  private async sendWebPush(
    sub: PushSubscription,
    payload: { title: string; body: string },
  ): Promise<void> {
    // web-push would be used here; using fetch as placeholder
    // In production: webpush.sendNotification(subscription, JSON.stringify(payload))
    const webpush = await import('web-push').catch(() => null);
    if (!webpush) return;
    webpush.setVapidDetails(
      'mailto:admin@example.com',
      this.vapidPublicKey,
      this.vapidPrivateKey,
    );
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
    );
  }

  private async sendFcm(
    fcmToken: string,
    payload: { title: string; body: string },
  ): Promise<void> {
    await fetch('https://fcm.googleapis.com/v1/projects/default/messages:send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.fcmServerKey}`,
      },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          notification: { title: payload.title, body: payload.body },
        },
      }),
    });
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { user_id: userId, is_read: false },
      order: { created_at: 'DESC' },
      take: 20,
    });
  }

  async markRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, user_id: userId },
    });
    if (!notification) throw new NotFoundException(`Notification ${notificationId} not found`);
    notification.is_read = true;
    return this.notificationRepo.save(notification);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationRepo.update({ user_id: userId, is_read: false }, { is_read: true });
  }

  async broadcast(
    payload: { type: string; title: string; body: string },
    batchId?: string,
  ): Promise<void> {
    let userIds: string[];
    if (batchId) {
      const result = await this.userRepo
        .createQueryBuilder('u')
        .innerJoin('enrollments', 'e', 'e.student_id = u.id AND e.batch_id = :batchId', { batchId })
        .select('u.id')
        .getRawMany();
      userIds = result.map((r) => r.u_id);
    } else {
      const users = await this.userRepo.find({ select: ['id'] });
      userIds = users.map((u) => u.id);
    }

    for (const userId of userIds) {
      await this.send(userId, payload, true);
    }
  }
}
