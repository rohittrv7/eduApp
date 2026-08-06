/**
 * Unit Tests for Batch Enrollment and Capacity Enforcement
 *
 * Validates: Requirements 23.3, 23.6
 */

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { Batch } from './entities/batch.entity';
import { Enrollment } from './entities/enrollment.entity';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeBatch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: 'batch-uuid-1',
    teacher_id: 'teacher-uuid-1',
    name: 'Test Batch',
    slug: 'test-batch',
    description: null,
    target_exam: null,
    language: 'hindi' as any,
    price: 0,
    is_free: true,
    trial_days: 0,
    capacity: null,
    is_featured: false,
    is_active: true,
    thumbnail: null,
    start_date: null,
    end_date: null,
    certificate_enabled: true,
    revenue_share_pct: 0,
    created_at: new Date(),
    updated_at: new Date(),
    teacher: null as any,
    ...overrides,
  };
}

function makeEnrollment(overrides: Partial<Enrollment> = {}): Enrollment {
  return {
    id: 'enrollment-uuid-1',
    student_id: 'student-uuid-1',
    batch_id: 'batch-uuid-1',
    enrolled_at: new Date(),
    expires_at: null,
    is_active: true,
    student: null as any,
    batch: null as any,
    ...overrides,
  };
}

function makeBatchRepo(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    ...overrides,
  } as any;
}

function makeEnrollmentRepo(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    ...overrides,
  } as any;
}

function makeService(batchRepo: any, enrollmentRepo: any): BatchesService {
  const service = new BatchesService(
    batchRepo,
    enrollmentRepo,
    {} as any, // videoRepo
    {} as any, // subjectRepo
    {} as any, // chapterRepo
    {} as any, // liveClassRepo
  );
  return service;
}

// ─── Requirement 23.3: Free enrollment grants immediate access ────────────────

describe('Requirement 23.3 – Free enrollment grants immediate access', () => {
  it('creates enrollment with is_active: true for a free batch', async () => {
    const batch = makeBatch({ is_free: true, capacity: null });
    const savedEnrollment = makeEnrollment({ is_active: true });

    const batchRepo = makeBatchRepo({
      findOne: jest.fn().mockResolvedValue(batch),
    });
    const enrollmentRepo = makeEnrollmentRepo({
      findOne: jest.fn().mockResolvedValue(null), // not already enrolled
      create: jest.fn().mockReturnValue(savedEnrollment),
      save: jest.fn().mockResolvedValue(savedEnrollment),
      count: jest.fn().mockResolvedValue(0),
    });

    const service = makeService(batchRepo, enrollmentRepo);
    const result = await service.enroll('student-uuid-1', 'batch-uuid-1');

    expect(enrollmentRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: true }),
    );
    expect(result.is_active).toBe(true);
  });

  it('sets expires_at to null when batch has no trial days', async () => {
    const batch = makeBatch({ is_free: true, trial_days: 0, capacity: null });
    const savedEnrollment = makeEnrollment({ expires_at: null });

    const batchRepo = makeBatchRepo({
      findOne: jest.fn().mockResolvedValue(batch),
    });
    const enrollmentRepo = makeEnrollmentRepo({
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(savedEnrollment),
      save: jest.fn().mockResolvedValue(savedEnrollment),
      count: jest.fn().mockResolvedValue(0),
    });

    const service = makeService(batchRepo, enrollmentRepo);
    const result = await service.enroll('student-uuid-1', 'batch-uuid-1');

    expect(enrollmentRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ expires_at: null }),
    );
    expect(result.expires_at).toBeNull();
  });

  it('sets expires_at when batch has trial days', async () => {
    const batch = makeBatch({ is_free: true, trial_days: 7, capacity: null });
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const savedEnrollment = makeEnrollment({ expires_at: futureDate });

    const batchRepo = makeBatchRepo({
      findOne: jest.fn().mockResolvedValue(batch),
    });
    const enrollmentRepo = makeEnrollmentRepo({
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(savedEnrollment),
      save: jest.fn().mockResolvedValue(savedEnrollment),
      count: jest.fn().mockResolvedValue(0),
    });

    const service = makeService(batchRepo, enrollmentRepo);
    const result = await service.enroll('student-uuid-1', 'batch-uuid-1');

    expect(enrollmentRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        expires_at: expect.any(Date),
      }),
    );
    expect(result.expires_at).not.toBeNull();
  });

  it('throws BadRequestException when batch is not free', async () => {
    const batch = makeBatch({ is_free: false, price: 999 });

    const batchRepo = makeBatchRepo({
      findOne: jest.fn().mockResolvedValue(batch),
    });
    const enrollmentRepo = makeEnrollmentRepo();
    const service = makeService(batchRepo, enrollmentRepo);

    await expect(service.enroll('student-uuid-1', 'batch-uuid-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(enrollmentRepo.create).not.toHaveBeenCalled();
  });

  it('throws ConflictException when student is already enrolled', async () => {
    const batch = makeBatch({ is_free: true });
    const existingEnrollment = makeEnrollment();

    const batchRepo = makeBatchRepo({
      findOne: jest.fn().mockResolvedValue(batch),
    });
    const enrollmentRepo = makeEnrollmentRepo({
      findOne: jest.fn().mockResolvedValue(existingEnrollment),
    });
    const service = makeService(batchRepo, enrollmentRepo);

    await expect(service.enroll('student-uuid-1', 'batch-uuid-1')).rejects.toThrow(
      ConflictException,
    );
    expect(enrollmentRepo.create).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when batch does not exist', async () => {
    const batchRepo = makeBatchRepo({
      findOne: jest.fn().mockResolvedValue(null),
    });
    const enrollmentRepo = makeEnrollmentRepo();
    const service = makeService(batchRepo, enrollmentRepo);

    await expect(service.enroll('student-uuid-1', 'nonexistent-batch')).rejects.toThrow(
      NotFoundException,
    );
  });
});

// ─── Requirement 23.6: Capacity limit enforcement ────────────────────────────

describe('Requirement 23.6 – Capacity limit blocks enrollment when batch is full', () => {
  it('throws ConflictException with "Batch Full" when enrolled_count equals capacity', async () => {
    const batch = makeBatch({ is_free: true, capacity: 30 });

    const batchRepo = makeBatchRepo({
      findOne: jest.fn().mockResolvedValue(batch),
    });
    const enrollmentRepo = makeEnrollmentRepo({
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(30), // exactly at capacity
    });
    const service = makeService(batchRepo, enrollmentRepo);

    await expect(service.enroll('student-uuid-1', 'batch-uuid-1')).rejects.toThrow(
      new ConflictException('Batch Full'),
    );
    expect(enrollmentRepo.create).not.toHaveBeenCalled();
  });

  it('throws ConflictException with "Batch Full" when enrolled_count exceeds capacity', async () => {
    const batch = makeBatch({ is_free: true, capacity: 10 });

    const batchRepo = makeBatchRepo({
      findOne: jest.fn().mockResolvedValue(batch),
    });
    const enrollmentRepo = makeEnrollmentRepo({
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(15), // over capacity
    });
    const service = makeService(batchRepo, enrollmentRepo);

    await expect(service.enroll('student-uuid-1', 'batch-uuid-1')).rejects.toThrow(
      new ConflictException('Batch Full'),
    );
    expect(enrollmentRepo.create).not.toHaveBeenCalled();
  });

  it('allows enrollment when enrolled_count is below capacity', async () => {
    const batch = makeBatch({ is_free: true, capacity: 30 });
    const savedEnrollment = makeEnrollment();

    const batchRepo = makeBatchRepo({
      findOne: jest.fn().mockResolvedValue(batch),
    });
    const enrollmentRepo = makeEnrollmentRepo({
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(29), // one slot remaining
      create: jest.fn().mockReturnValue(savedEnrollment),
      save: jest.fn().mockResolvedValue(savedEnrollment),
    });
    const service = makeService(batchRepo, enrollmentRepo);

    const result = await service.enroll('student-uuid-1', 'batch-uuid-1');

    expect(result).toEqual(savedEnrollment);
    expect(enrollmentRepo.create).toHaveBeenCalled();
  });

  it('skips capacity check when batch has no capacity limit (capacity is null)', async () => {
    const batch = makeBatch({ is_free: true, capacity: null });
    const savedEnrollment = makeEnrollment();

    const batchRepo = makeBatchRepo({
      findOne: jest.fn().mockResolvedValue(batch),
    });
    const enrollmentRepo = makeEnrollmentRepo({
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(savedEnrollment),
      save: jest.fn().mockResolvedValue(savedEnrollment),
      count: jest.fn().mockResolvedValue(0),
    });
    const service = makeService(batchRepo, enrollmentRepo);

    const result = await service.enroll('student-uuid-1', 'batch-uuid-1');

    // count should NOT be called since capacity is null
    expect(enrollmentRepo.count).not.toHaveBeenCalled();
    expect(result).toEqual(savedEnrollment);
  });

  it('counts only active enrollments when checking capacity', async () => {
    const batch = makeBatch({ is_free: true, capacity: 5 });
    const savedEnrollment = makeEnrollment();

    const batchRepo = makeBatchRepo({
      findOne: jest.fn().mockResolvedValue(batch),
    });
    const enrollmentRepo = makeEnrollmentRepo({
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(4), // 4 active, 1 slot left
      create: jest.fn().mockReturnValue(savedEnrollment),
      save: jest.fn().mockResolvedValue(savedEnrollment),
    });
    const service = makeService(batchRepo, enrollmentRepo);

    await service.enroll('student-uuid-1', 'batch-uuid-1');

    expect(enrollmentRepo.count).toHaveBeenCalledWith({
      where: { batch_id: 'batch-uuid-1', is_active: true },
    });
  });
});
