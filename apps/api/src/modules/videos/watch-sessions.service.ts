import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchSession } from './entities/watch-session.entity';
import { RecordedVideo } from './entities/recorded-video.entity';
import { RedisService } from '../../common/redis/redis.service';
import { UpsertWatchSessionDto } from './dto/upsert-watch-session.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WatchSessionsService {
  constructor(
    @InjectRepository(WatchSession)
    private readonly watchSessionRepo: Repository<WatchSession>,
    @InjectRepository(RecordedVideo)
    private readonly videoRepo: Repository<RecordedVideo>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly redisService: RedisService,
  ) {}

  async getRecentSessions(studentId: string): Promise<any[]> {
    const sessions = await this.watchSessionRepo
      .createQueryBuilder('ws')
      .leftJoin('recorded_videos', 'v', 'v.id = ws.video_id')
      .select([
        'ws.video_id AS "videoId"',
        'v.title AS title',
        'v.thumbnail AS thumbnail',
        'ws.last_position AS "lastPosition"',
        'ws.watch_time_secs AS "watchTimeSecs"',
        'v.duration_seconds AS "durationSeconds"',
      ])
      .where('ws.student_id = :studentId AND ws.video_id IS NOT NULL', { studentId })
      .orderBy('ws.updated_at', 'DESC')
      .limit(10)
      .getRawMany();

    return sessions.map((s: any) => ({
      videoId: s.videoId,
      title: s.title ?? '',
      thumbnail: s.thumbnail ?? null,
      lastPosition: s.lastPosition ?? 0,
      watchTimeSecs: s.watchTimeSecs ?? 0,
      progressPercent: s.durationSeconds
        ? Math.min(Math.round((s.watchTimeSecs / s.durationSeconds) * 100), 100)
        : 0,
    }));
  }

  async upsertWatchSession(
    studentId: string,
    videoId: string,
    dto: UpsertWatchSessionDto,
  ): Promise<WatchSession> {
    const video = await this.videoRepo.findOne({ where: { id: videoId } });
    if (!video) {
      throw new NotFoundException(`Video ${videoId} not found`);
    }

    const watchSecs = dto.watch_time_secs ?? dto.watchTimeSecs ?? 0;
    const pos = dto.last_position ?? dto.lastPosition ?? 0;

    const today = new Date().toISOString().slice(0, 10);
    let session = await this.watchSessionRepo.findOne({
      where: { student_id: studentId, video_id: videoId, session_date: today },
    });

    if (session) {
      session.watch_time_secs += watchSecs;
      session.last_position = pos;
      const duration = dto.duration_seconds ?? dto.durationSeconds ?? video.duration_seconds;
      if (duration > 0 && session.watch_time_secs >= duration * 0.9) {
        session.completed = true;
      }
    } else {
      session = this.watchSessionRepo.create({
        student_id: studentId,
        video_id: videoId,
        watch_time_secs: watchSecs,
        last_position: pos,
        session_date: today,
        completed: false,
      });
    }

    const saved = await this.watchSessionRepo.save(session);

    // Award points: 1 point per 10 minutes watched (only on new watch time)
    if (watchSecs > 0) {
      const pointsToAdd = Math.floor(watchSecs / 600); // 1 pt per 10 min
      if (pointsToAdd > 0) {
        await this.userRepo
          .createQueryBuilder()
          .update(User)
          .set({ cumulative_score: () => `cumulative_score + ${pointsToAdd}` })
          .where('id = :id', { id: studentId })
          .execute();
      }
    }

    return saved;
  }

  async getWatchSession(studentId: string, videoId: string): Promise<WatchSession | null> {
    const today = new Date().toISOString().slice(0, 10);
    return this.watchSessionRepo.findOne({
      where: { student_id: studentId, video_id: videoId, session_date: today },
    });
  }

  async getTotalWatchTime(studentId: string, videoId: string): Promise<number> {
    const result = await this.watchSessionRepo
      .createQueryBuilder('ws')
      .select('SUM(ws.watch_time_secs)', 'total')
      .where('ws.student_id = :studentId AND ws.video_id = :videoId', { studentId, videoId })
      .getRawOne();
    return result?.total ? parseInt(result.total, 10) : 0;
  }

  async queueWatchSession(userId: string, payload: object): Promise<void> {
    const key = `watch:queue:${userId}`;
    await this.redisService.set(
      key,
      JSON.stringify(payload),
    );
  }

  async drainQueue(userId: string): Promise<void> {
    const key = `watch:queue:${userId}`;
    const raw = await this.redisService.get(key);
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as { videoId: string; dto: UpsertWatchSessionDto };
      await this.upsertWatchSession(userId, payload.videoId, payload.dto);
      await this.redisService.del(key);
    } catch {
      // ignore parse errors
    }
  }

  async getQuizUnlockStatus(
    studentId: string,
    videoId: string,
    unlockThreshold: number,
  ): Promise<{ unlocked: boolean; progressPercent: number }> {
    const video = await this.videoRepo.findOne({ where: { id: videoId } });
    if (!video) {
      throw new NotFoundException(`Video ${videoId} not found`);
    }
    const totalWatchTime = await this.getTotalWatchTime(studentId, videoId);
    const duration = video.duration_seconds;
    const progressPercent = duration > 0 ? (totalWatchTime / duration) * 100 : 0;
    return {
      unlocked: progressPercent >= unlockThreshold,
      progressPercent: Math.min(progressPercent, 100),
    };
  }
}
