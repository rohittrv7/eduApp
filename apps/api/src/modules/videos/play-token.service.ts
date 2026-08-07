import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecordedVideo } from './entities/recorded-video.entity';
import { LiveClass } from '../live-classes/entities/live-class.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';

interface PlayTokenPayload {
  sub: string; // userId
  vid: string; // videoId or liveClassId
  type: 'video' | 'live';
}

/**
 * Issues short-lived JWT play tokens for videos and live classes.
 * The token encodes userId + videoId — youtube_url/youtube_video_id
 * are NEVER sent to the client in normal API responses.
 *
 * Flow:
 *  1. Student POSTs /videos/:id/play-token  (enrollment checked here)
 *  2. API returns { token, expiresAt }
 *  3. Frontend POSTs /videos/:id/resolve-token?token=xxx
 *  4. API verifies JWT → returns { youtubeVideoId }
 *  5. Player embeds the video — URL never exposed
 */
@Injectable()
export class PlayTokenService {
  private readonly TTL_SECONDS = 4 * 60 * 60; // 4 hours

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(RecordedVideo)
    private readonly videoRepo: Repository<RecordedVideo>,
    @InjectRepository(LiveClass)
    private readonly liveClassRepo: Repository<LiveClass>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
  ) {}

  private getJwtSecret(): string {
    const secret = process.env['JWT_ACCESS_SECRET'];
    if (!secret) throw new UnauthorizedException('JWT_ACCESS_SECRET configuration is missing');
    return secret;
  }

  /** Issue a play token for a recorded video */
  async issueVideoToken(videoId: string, userId: string, userRole: string) {
    const video = await this.videoRepo.findOne({ where: { id: videoId } });
    if (!video) throw new ForbiddenException('Video not found');

    // Teachers and admins bypass enrollment check
    if (userRole !== 'teacher' && userRole !== 'admin') {
      const enrollment = await this.enrollmentRepo.findOne({
        where: { student_id: userId, batch_id: video.batch_id, is_active: true },
      });
      if (!enrollment) {
        throw new ForbiddenException('You must be enrolled in this batch to watch this video');
      }
    }

    const payload: PlayTokenPayload = { sub: userId, vid: videoId, type: 'video' };
    const token = this.jwtService.sign(payload, {
      secret: this.getJwtSecret(),
      expiresIn: this.TTL_SECONDS,
    });

    return {
      token,
      expiresAt: new Date(Date.now() + this.TTL_SECONDS * 1000).toISOString(),
    };
  }

  /** Issue a play token for a live class */
  async issueLiveToken(classId: string, userId: string, userRole: string) {
    const liveClass = await this.liveClassRepo.findOne({ where: { id: classId } });
    if (!liveClass) throw new ForbiddenException('Live class not found');

    if (userRole !== 'teacher' && userRole !== 'admin') {
      const enrollment = await this.enrollmentRepo.findOne({
        where: { student_id: userId, batch_id: liveClass.batch_id, is_active: true },
      });
      if (!enrollment) {
        throw new ForbiddenException('You must be enrolled in this batch to join this class');
      }
    }

    const payload: PlayTokenPayload = { sub: userId, vid: classId, type: 'live' };
    const token = this.jwtService.sign(payload, {
      secret: this.getJwtSecret(),
      expiresIn: this.TTL_SECONDS,
    });

    return {
      token,
      expiresAt: new Date(Date.now() + this.TTL_SECONDS * 1000).toISOString(),
    };
  }

  /** Resolve a play token → return youtubeVideoId only (never the full URL) */
  async resolveToken(
    token: string,
    expectedType: 'video' | 'live',
  ): Promise<{ youtubeVideoId: string }> {
    let payload: PlayTokenPayload;
    try {
      payload = this.jwtService.verify<PlayTokenPayload>(token, {
        secret: this.getJwtSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired play token');
    }

    if (payload.type !== expectedType) {
      throw new UnauthorizedException('Token type mismatch');
    }

    if (expectedType === 'video') {
      const video = await this.videoRepo.findOne({ where: { id: payload.vid } });
      if (!video) throw new ForbiddenException('Video not found');
      return { youtubeVideoId: video.youtube_video_id };
    } else {
      const liveClass = await this.liveClassRepo.findOne({ where: { id: payload.vid } });
      if (!liveClass) throw new ForbiddenException('Live class not found');
      return { youtubeVideoId: liveClass.youtube_video_id ?? '' };
    }
  }
}
