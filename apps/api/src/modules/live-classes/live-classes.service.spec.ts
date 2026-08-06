/**
 * Unit Tests for Live Class Status Transitions
 *
 * Validates: Requirements 17.1, 17.5
 */

import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { LiveClassesService } from './live-classes.service';
import { LiveClass, LiveClassStatus } from './entities/live-class.entity';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TEACHER_ID = 'teacher-uuid-1';
const OTHER_TEACHER_ID = 'teacher-uuid-2';
const CLASS_ID = 'class-uuid-1';

function makeLiveClass(overrides: Partial<LiveClass> = {}): LiveClass {
  return {
    id: CLASS_ID,
    teacher_id: TEACHER_ID,
    batch_id: 'batch-uuid-1',
    chapter_id: null,
    title: 'Test Live Class',
    description: null,
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtube_video_id: 'dQw4w9WgXcQ',
    scheduled_at: new Date(),
    started_at: null,
    ended_at: null,
    status: LiveClassStatus.APPROVED,
    recording_url: null,
    viewer_count: 0,
    subject_id: null,
    created_at: new Date(),
    updated_at: new Date(),
    batch: null as any,
    teacher: null as any,
    chapter: null,
    ...overrides,
  };
}

function makeLiveClassRepo(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    ...overrides,
  } as any;
}

function makeService(liveClassRepo: any): LiveClassesService {
  return new LiveClassesService(
    liveClassRepo,
    {} as any, // attendanceRepo
    {} as any, // enrollmentRepo
    {} as any, // videoRepo
    {} as any, // redisService
    {} as any, // reminderCron
  );
}

// ─── Requirement 17.1: Go-live rejected outside 15-min window ─────────────────

describe('Requirement 17.1 – Go-live rejected outside 15-minute window', () => {
  it('throws BadRequestException when scheduled time is more than 15 min in the future', async () => {
    const scheduledAt = new Date(Date.now() + 20 * 60 * 1000); // 20 min from now
    const liveClass = makeLiveClass({ scheduled_at: scheduledAt });

    const repo = makeLiveClassRepo({
      findOne: jest.fn().mockResolvedValue(liveClass),
    });
    const service = makeService(repo);

    await expect(service.goLive(CLASS_ID, TEACHER_ID)).rejects.toThrow(BadRequestException);
    await expect(service.goLive(CLASS_ID, TEACHER_ID)).rejects.toThrow(
      'Cannot go live more than 15 minutes before scheduled time',
    );
  });

  it('throws BadRequestException exactly at the 16-minute boundary', async () => {
    const scheduledAt = new Date(Date.now() + 16 * 60 * 1000); // 16 min from now
    const liveClass = makeLiveClass({ scheduled_at: scheduledAt });

    const repo = makeLiveClassRepo({
      findOne: jest.fn().mockResolvedValue(liveClass),
    });
    const service = makeService(repo);

    await expect(service.goLive(CLASS_ID, TEACHER_ID)).rejects.toThrow(BadRequestException);
  });

  it('allows go-live exactly at the 15-minute boundary', async () => {
    const scheduledAt = new Date(Date.now() + 15 * 60 * 1000 - 1000); // just under 15 min
    const liveClass = makeLiveClass({ scheduled_at: scheduledAt });
    const saved = makeLiveClass({
      scheduled_at: scheduledAt,
      status: LiveClassStatus.ACTIVE,
      started_at: new Date(),
    });

    const repo = makeLiveClassRepo({
      findOne: jest.fn().mockResolvedValue(liveClass),
      save: jest.fn().mockResolvedValue(saved),
    });
    const service = makeService(repo);

    const result = await service.goLive(CLASS_ID, TEACHER_ID);

    expect(result.status).toBe(LiveClassStatus.ACTIVE);
  });

  it('allows go-live when scheduled time is in the past', async () => {
    const scheduledAt = new Date(Date.now() - 5 * 60 * 1000); // 5 min ago
    const liveClass = makeLiveClass({ scheduled_at: scheduledAt });
    const saved = makeLiveClass({
      scheduled_at: scheduledAt,
      status: LiveClassStatus.ACTIVE,
      started_at: new Date(),
    });

    const repo = makeLiveClassRepo({
      findOne: jest.fn().mockResolvedValue(liveClass),
      save: jest.fn().mockResolvedValue(saved),
    });
    const service = makeService(repo);

    const result = await service.goLive(CLASS_ID, TEACHER_ID);

    expect(result.status).toBe(LiveClassStatus.ACTIVE);
  });

  it('allows go-live when scheduled time is now', async () => {
    const scheduledAt = new Date(); // right now
    const liveClass = makeLiveClass({ scheduled_at: scheduledAt });
    const saved = makeLiveClass({
      scheduled_at: scheduledAt,
      status: LiveClassStatus.ACTIVE,
      started_at: new Date(),
    });

    const repo = makeLiveClassRepo({
      findOne: jest.fn().mockResolvedValue(liveClass),
      save: jest.fn().mockResolvedValue(saved),
    });
    const service = makeService(repo);

    const result = await service.goLive(CLASS_ID, TEACHER_ID);

    expect(result.status).toBe(LiveClassStatus.ACTIVE);
  });

  it('throws ForbiddenException when a different teacher tries to go live', async () => {
    const liveClass = makeLiveClass({ teacher_id: TEACHER_ID });

    const repo = makeLiveClassRepo({
      findOne: jest.fn().mockResolvedValue(liveClass),
    });
    const service = makeService(repo);

    await expect(service.goLive(CLASS_ID, OTHER_TEACHER_ID)).rejects.toThrow(ForbiddenException);
  });

  it('throws BadRequestException when class is not in APPROVED status', async () => {
    const liveClass = makeLiveClass({ status: LiveClassStatus.SCHEDULED });

    const repo = makeLiveClassRepo({
      findOne: jest.fn().mockResolvedValue(liveClass),
    });
    const service = makeService(repo);

    await expect(service.goLive(CLASS_ID, TEACHER_ID)).rejects.toThrow(BadRequestException);
    await expect(service.goLive(CLASS_ID, TEACHER_ID)).rejects.toThrow(
      'Live class must be approved before going live',
    );
  });

  it('throws NotFoundException when class does not exist', async () => {
    const repo = makeLiveClassRepo({
      findOne: jest.fn().mockResolvedValue(null),
    });
    const service = makeService(repo);

    await expect(service.goLive('nonexistent-id', TEACHER_ID)).rejects.toThrow(NotFoundException);
  });

  it('sets status to ACTIVE and records started_at on successful go-live', async () => {
    const scheduledAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min from now (within window)
    const liveClass = makeLiveClass({ scheduled_at: scheduledAt });

    const repo = makeLiveClassRepo({
      findOne: jest.fn().mockResolvedValue(liveClass),
      save: jest.fn().mockImplementation(async (cls: LiveClass) => cls),
    });
    const service = makeService(repo);

    const before = new Date();
    const result = await service.goLive(CLASS_ID, TEACHER_ID);
    const after = new Date();

    expect(result.status).toBe(LiveClassStatus.ACTIVE);
    expect(result.started_at).not.toBeNull();
    expect(result.started_at!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.started_at!.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

// ─── Requirement 17.5: End-live sets timestamps and emits event ───────────────

describe('Requirement 17.5 – End-live sets correct timestamps and emits class:ended event', () => {
  it('sets status to ENDED on endLive', async () => {
    const liveClass = makeLiveClass({ status: LiveClassStatus.ACTIVE });

    const repo = makeLiveClassRepo({
      findOne: jest.fn().mockResolvedValue(liveClass),
      save: jest.fn().mockImplementation(async (cls: LiveClass) => cls),
    });
    const service = makeService(repo);

    const result = await service.endLive(CLASS_ID, TEACHER_ID);

    expect(result.status).toBe(LiveClassStatus.ENDED);
  });

  it('records ended_at timestamp on endLive', async () => {
    const liveClass = makeLiveClass({ status: LiveClassStatus.ACTIVE });

    const repo = makeLiveClassRepo({
      findOne: jest.fn().mockResolvedValue(liveClass),
      save: jest.fn().mockImplementation(async (cls: LiveClass) => cls),
    });
    const service = makeService(repo);

    const before = new Date();
    const result = await service.endLive(CLASS_ID, TEACHER_ID);
    const after = new Date();

    expect(result.ended_at).not.toBeNull();
    expect(result.ended_at!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.ended_at!.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('persists the ended class via repository save', async () => {
    const liveClass = makeLiveClass({ status: LiveClassStatus.ACTIVE });

    const saveMock = jest.fn().mockImplementation(async (cls: LiveClass) => cls);
    const repo = makeLiveClassRepo({
      findOne: jest.fn().mockResolvedValue(liveClass),
      save: saveMock,
    });
    const service = makeService(repo);

    await service.endLive(CLASS_ID, TEACHER_ID);

    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: LiveClassStatus.ENDED,
        ended_at: expect.any(Date),
      }),
    );
  });

  it('throws ForbiddenException when a different teacher tries to end the class', async () => {
    const liveClass = makeLiveClass({ teacher_id: TEACHER_ID, status: LiveClassStatus.ACTIVE });

    const repo = makeLiveClassRepo({
      findOne: jest.fn().mockResolvedValue(liveClass),
    });
    const service = makeService(repo);

    await expect(service.endLive(CLASS_ID, OTHER_TEACHER_ID)).rejects.toThrow(ForbiddenException);
    await expect(service.endLive(CLASS_ID, OTHER_TEACHER_ID)).rejects.toThrow(
      'You do not own this live class',
    );
  });

  it('throws NotFoundException when class does not exist', async () => {
    const repo = makeLiveClassRepo({
      findOne: jest.fn().mockResolvedValue(null),
    });
    const service = makeService(repo);

    await expect(service.endLive('nonexistent-id', TEACHER_ID)).rejects.toThrow(NotFoundException);
  });

  it('does not modify started_at when ending a live class', async () => {
    const startedAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    const liveClass = makeLiveClass({ status: LiveClassStatus.ACTIVE, started_at: startedAt });

    const repo = makeLiveClassRepo({
      findOne: jest.fn().mockResolvedValue(liveClass),
      save: jest.fn().mockImplementation(async (cls: LiveClass) => cls),
    });
    const service = makeService(repo);

    const result = await service.endLive(CLASS_ID, TEACHER_ID);

    expect(result.started_at).toEqual(startedAt);
  });

  it('ended_at is always after started_at', async () => {
    const startedAt = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago
    const liveClass = makeLiveClass({ status: LiveClassStatus.ACTIVE, started_at: startedAt });

    const repo = makeLiveClassRepo({
      findOne: jest.fn().mockResolvedValue(liveClass),
      save: jest.fn().mockImplementation(async (cls: LiveClass) => cls),
    });
    const service = makeService(repo);

    const result = await service.endLive(CLASS_ID, TEACHER_ID);

    expect(result.ended_at!.getTime()).toBeGreaterThan(result.started_at!.getTime());
  });
});
