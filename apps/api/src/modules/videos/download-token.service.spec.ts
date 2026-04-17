/**
 * Unit Tests for DownloadTokenService
 * Tests: token issuance, signature verification, expiry, provider gate, enrollment check
 */

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DownloadTokenService } from './download-token.service';

function makeConfigService(provider = 'gumlet', secret = 'test_secret_32_chars_long_enough') {
  return {
    get: jest.fn((key: string) => {
      if (key === 'video.provider') return provider;
      if (key === 'video.downloadTokenSecret') return secret;
      return undefined;
    }),
  } as any;
}

function makeVideoRepo(video: any) {
  return { findOne: jest.fn().mockResolvedValue(video) } as any;
}

function makeEnrollmentRepo(enrollment: any) {
  return { findOne: jest.fn().mockResolvedValue(enrollment) } as any;
}

function makeVideo(overrides = {}) {
  return { id: 'video-1', batch_id: 'batch-1', title: 'Test Video', ...overrides };
}

function makeEnrollment(overrides = {}) {
  return {
    id: 'enroll-1',
    student_id: 'student-1',
    batch_id: 'batch-1',
    is_active: true,
    expires_at: null,
    ...overrides,
  };
}

describe('DownloadTokenService', () => {
  describe('issueToken – provider gate', () => {
    it('throws ForbiddenException when VIDEO_PROVIDER=youtube', async () => {
      const service = new DownloadTokenService(
        makeConfigService('youtube'),
        makeVideoRepo(makeVideo()),
        makeEnrollmentRepo(makeEnrollment()),
      );
      await expect(service.issueToken('video-1', 'student-1')).rejects.toThrow(ForbiddenException);
      await expect(service.issueToken('video-1', 'student-1')).rejects.toThrow(
        'Offline download is not available for YouTube-hosted videos.',
      );
    });

    it('proceeds when VIDEO_PROVIDER=gumlet', async () => {
      const service = new DownloadTokenService(
        makeConfigService('gumlet'),
        makeVideoRepo(makeVideo()),
        makeEnrollmentRepo(makeEnrollment()),
      );
      const result = await service.issueToken('video-1', 'student-1');
      expect(result.token).toBeDefined();
    });

    it('proceeds when VIDEO_PROVIDER=self-hosted', async () => {
      const service = new DownloadTokenService(
        makeConfigService('self-hosted'),
        makeVideoRepo(makeVideo()),
        makeEnrollmentRepo(makeEnrollment()),
      );
      const result = await service.issueToken('video-1', 'student-1');
      expect(result.token).toBeDefined();
    });
  });

  describe('issueToken – enrollment check', () => {
    it('throws NotFoundException when video does not exist', async () => {
      const service = new DownloadTokenService(
        makeConfigService('gumlet'),
        makeVideoRepo(null),
        makeEnrollmentRepo(makeEnrollment()),
      );
      await expect(service.issueToken('nonexistent', 'student-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when student is not enrolled', async () => {
      const service = new DownloadTokenService(
        makeConfigService('gumlet'),
        makeVideoRepo(makeVideo()),
        makeEnrollmentRepo(null), // not enrolled
      );
      await expect(service.issueToken('video-1', 'student-1')).rejects.toThrow(ForbiddenException);
      await expect(service.issueToken('video-1', 'student-1')).rejects.toThrow(
        'You must be enrolled in this batch to download.',
      );
    });
  });

  describe('issueToken – payload', () => {
    it('includes correct videoId and studentId in payload', async () => {
      const service = new DownloadTokenService(
        makeConfigService('gumlet'),
        makeVideoRepo(makeVideo()),
        makeEnrollmentRepo(makeEnrollment()),
      );
      const { payload } = await service.issueToken('video-1', 'student-1');
      expect(payload.videoId).toBe('video-1');
      expect(payload.studentId).toBe('student-1');
    });

    it('sets enrollmentExpiresAt to null when enrollment has no expiry', async () => {
      const service = new DownloadTokenService(
        makeConfigService('gumlet'),
        makeVideoRepo(makeVideo()),
        makeEnrollmentRepo(makeEnrollment({ expires_at: null })),
      );
      const { payload } = await service.issueToken('video-1', 'student-1');
      expect(payload.enrollmentExpiresAt).toBeNull();
    });

    it('sets enrollmentExpiresAt to ISO string when enrollment has expiry', async () => {
      const expiryDate = new Date('2026-12-31T00:00:00.000Z');
      const service = new DownloadTokenService(
        makeConfigService('gumlet'),
        makeVideoRepo(makeVideo()),
        makeEnrollmentRepo(makeEnrollment({ expires_at: expiryDate })),
      );
      const { payload } = await service.issueToken('video-1', 'student-1');
      expect(payload.enrollmentExpiresAt).toBe(expiryDate.toISOString());
    });

    it('token expires in 1 hour', async () => {
      const service = new DownloadTokenService(
        makeConfigService('gumlet'),
        makeVideoRepo(makeVideo()),
        makeEnrollmentRepo(makeEnrollment()),
      );
      const before = Math.floor(Date.now() / 1000);
      const { payload } = await service.issueToken('video-1', 'student-1');
      const after = Math.floor(Date.now() / 1000);
      expect(payload.expiresAt).toBeGreaterThanOrEqual(before + 3600);
      expect(payload.expiresAt).toBeLessThanOrEqual(after + 3600);
    });
  });

  describe('verify – signature validation', () => {
    it('verifies a valid token and returns payload', async () => {
      const service = new DownloadTokenService(
        makeConfigService('gumlet'),
        makeVideoRepo(makeVideo()),
        makeEnrollmentRepo(makeEnrollment()),
      );
      const { token, payload: issued } = await service.issueToken('video-1', 'student-1');
      const verified = service.verify(token);
      expect(verified.videoId).toBe(issued.videoId);
      expect(verified.studentId).toBe(issued.studentId);
    });

    it('throws ForbiddenException for tampered token', async () => {
      const service = new DownloadTokenService(
        makeConfigService('gumlet'),
        makeVideoRepo(makeVideo()),
        makeEnrollmentRepo(makeEnrollment()),
      );
      const { token } = await service.issueToken('video-1', 'student-1');
      const tampered = token.slice(0, -4) + 'aaaa'; // corrupt last 4 chars of signature
      expect(() => service.verify(tampered)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for malformed token (no dot separator)', () => {
      const service = new DownloadTokenService(
        makeConfigService('gumlet'),
        makeVideoRepo(null),
        makeEnrollmentRepo(null),
      );
      expect(() => service.verify('notavalidtoken')).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for expired token', () => {
      const service = new DownloadTokenService(
        makeConfigService('gumlet'),
        makeVideoRepo(null),
        makeEnrollmentRepo(null),
      );
      // Manually craft an expired payload
      const expiredPayload = {
        videoId: 'video-1',
        studentId: 'student-1',
        enrollmentExpiresAt: null,
        issuedAt: Math.floor(Date.now() / 1000) - 7200,
        expiresAt: Math.floor(Date.now() / 1000) - 3600, // expired 1 hour ago
      };
      const dataB64 = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const crypto = require('crypto');
      const sig = crypto
        .createHmac('sha256', 'test_secret_32_chars_long_enough')
        .update(dataB64)
        .digest('hex');
      const token = `${dataB64}.${sig}`;
      expect(() => service.verify(token)).toThrow(ForbiddenException);
      expect(() => service.verify(token)).toThrow('Download token has expired');
    });
  });
});
