import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { RecordedVideo } from './entities/recorded-video.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';

export interface DownloadTokenPayload {
  videoId: string;
  studentId: string;
  enrollmentExpiresAt: string | null; // ISO string or null = no expiry
  issuedAt: number;
  expiresAt: number; // token itself expires in 1 hour
}

/**
 * Issues signed download tokens for offline video access.
 * Only active when VIDEO_PROVIDER !== 'youtube'.
 * Token is HMAC-SHA256 signed — no JWT dependency needed.
 */
@Injectable()
export class DownloadTokenService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(RecordedVideo)
    private readonly videoRepo: Repository<RecordedVideo>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
  ) {}

  get videoProvider(): string {
    return this.config.get<string>('video.provider') ?? 'youtube';
  }

  async issueToken(
    videoId: string,
    studentId: string,
  ): Promise<{ token: string; payload: DownloadTokenPayload }> {
    if (this.videoProvider === 'youtube') {
      throw new ForbiddenException(
        'Offline download is not available for YouTube-hosted videos.',
      );
    }

    const video = await this.videoRepo.findOne({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video not found');

    // Verify enrollment
    const enrollment = await this.enrollmentRepo.findOne({
      where: { student_id: studentId, batch_id: video.batch_id, is_active: true },
    });
    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled in this batch to download.');
    }

    const now = Math.floor(Date.now() / 1000);
    const payload: DownloadTokenPayload = {
      videoId,
      studentId,
      enrollmentExpiresAt: enrollment.expires_at
        ? enrollment.expires_at.toISOString()
        : null,
      issuedAt: now,
      expiresAt: now + 3600, // token valid for 1 hour (download initiation only)
    };

    const token = this.sign(payload);
    return { token, payload };
  }

  verify(token: string): DownloadTokenPayload {
    const [dataB64, sig] = token.split('.');
    if (!dataB64 || !sig) throw new ForbiddenException('Invalid download token');

    const expectedSig = this.hmac(dataB64);
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      throw new ForbiddenException('Invalid download token signature');
    }

    const payload: DownloadTokenPayload = JSON.parse(
      Buffer.from(dataB64, 'base64url').toString('utf8'),
    );

    if (Math.floor(Date.now() / 1000) > payload.expiresAt) {
      throw new ForbiddenException('Download token has expired. Please request a new one.');
    }

    return payload;
  }

  private sign(payload: DownloadTokenPayload): string {
    const dataB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = this.hmac(dataB64);
    return `${dataB64}.${sig}`;
  }

  private hmac(data: string): string {
    const secret = this.config.get<string>('video.downloadTokenSecret') ?? 'fallback_secret';
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }
}
