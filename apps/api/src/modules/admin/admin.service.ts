import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Transaction, TransactionStatus } from '../payments/entities/transaction.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';
import { TeacherPayout, PayoutStatus } from '../payments/entities/teacher-payout.entity';
import { Batch } from '../batches/entities/batch.entity';
import { LiveClass, LiveClassStatus } from '../live-classes/entities/live-class.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { RedisService } from '../../common/redis/redis.service';

const DASHBOARD_CACHE_KEY = 'admin:dashboard';
const DASHBOARD_TTL = 300;

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(TeacherPayout)
    private readonly payoutRepo: Repository<TeacherPayout>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    @InjectRepository(LiveClass)
    private readonly liveClassRepo: Repository<LiveClass>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly redisService: RedisService,
  ) {}

  async getDashboard(): Promise<object> {
    try {
      const cached = await this.redisService.get(DASHBOARD_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // Redis unavailable — skip cache
    }

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      revToday,
      revWeek,
      revMonth,
      activeSubscriptions,
      enrollmentsToday,
      enrollmentsWeek,
      enrollmentsMonth,
      dailyRevRaw,
    ] = await Promise.all([
      this.transactionRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.final_amount), 0)', 'total')
        .where('t.status = :status AND t.created_at >= :dayAgo', {
          status: TransactionStatus.SUCCESS,
          dayAgo,
        })
        .getRawOne(),
      this.transactionRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.final_amount), 0)', 'total')
        .where('t.status = :status AND t.created_at >= :weekAgo', {
          status: TransactionStatus.SUCCESS,
          weekAgo,
        })
        .getRawOne(),
      this.transactionRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.final_amount), 0)', 'total')
        .where('t.status = :status AND t.created_at >= :monthAgo', {
          status: TransactionStatus.SUCCESS,
          monthAgo,
        })
        .getRawOne(),
      this.enrollmentRepo.count({ where: { is_active: true } }),
      this.enrollmentRepo
        .createQueryBuilder('e')
        .where('e.enrolled_at >= :dayAgo', { dayAgo })
        .getCount(),
      this.enrollmentRepo
        .createQueryBuilder('e')
        .where('e.enrolled_at >= :weekAgo', { weekAgo })
        .getCount(),
      this.enrollmentRepo
        .createQueryBuilder('e')
        .where('e.enrolled_at >= :monthAgo', { monthAgo })
        .getCount(),
      this.transactionRepo
        .createQueryBuilder('t')
        .select("TO_CHAR(t.created_at, 'YYYY-MM-DD')", 'date')
        .addSelect('COALESCE(SUM(t.final_amount), 0)', 'amount')
        .where('t.status = :status AND t.created_at >= :monthAgo', {
          status: TransactionStatus.SUCCESS,
          monthAgo,
        })
        .groupBy("TO_CHAR(t.created_at, 'YYYY-MM-DD')")
        .orderBy("TO_CHAR(t.created_at, 'YYYY-MM-DD')", 'ASC')
        .getRawMany(),
    ]);

    const dashboard = {
      revenue: {
        today: Number(revToday?.total ?? 0),
        week: Number(revWeek?.total ?? 0),
        month: Number(revMonth?.total ?? 0),
      },
      activeSubscriptions,
      newEnrollments: {
        today: enrollmentsToday,
        week: enrollmentsWeek,
        month: enrollmentsMonth,
      },
      dailyRevenue: (dailyRevRaw ?? []).map((r: any) => ({
        date: r.date,
        amount: Number(r.amount),
      })),
    };

    try {
      await this.redisService.set(DASHBOARD_CACHE_KEY, JSON.stringify(dashboard), DASHBOARD_TTL);
    } catch {
      // Redis unavailable — return without caching
    }
    return dashboard;
  }

  async getStudents(filters?: {
    search?: string;
    skillLevel?: string;
    lastActiveFrom?: string;
    lastActiveTo?: string;
    enrollmentStatus?: string;
    page?: number;
    limit?: number;
  }): Promise<object> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    let query = this.userRepo.createQueryBuilder('u').where('u.role = :role', { role: 'student' });

    if (filters?.search) {
      query = query.andWhere(
        '(u.full_name ILIKE :search OR u.mobile ILIKE :search OR u.email ILIKE :search)',
        {
          search: `%${filters.search}%`,
        },
      );
    }
    if (filters?.skillLevel) {
      query = query.andWhere('u.skill_level = :skillLevel', { skillLevel: filters.skillLevel });
    }
    if (filters?.lastActiveFrom) {
      query = query.andWhere('u.last_active >= :lastActiveFrom', {
        lastActiveFrom: new Date(filters.lastActiveFrom),
      });
    }
    if (filters?.lastActiveTo) {
      query = query.andWhere('u.last_active <= :lastActiveTo', {
        lastActiveTo: new Date(filters.lastActiveTo),
      });
    }

    const [users, total] = await query
      .orderBy('u.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const userIds = users.map((u) => u.id);

    // Enrollment counts per user
    const enrollmentCounts: Record<string, number> = {};
    if (userIds.length) {
      const counts = await this.enrollmentRepo
        .createQueryBuilder('e')
        .select('e.student_id', 'userId')
        .addSelect('COUNT(*)', 'count')
        .where('e.student_id IN (:...userIds)', { userIds })
        .groupBy('e.student_id')
        .getRawMany();
      counts.forEach((c: any) => {
        enrollmentCounts[c.userId] = Number(c.count);
      });
    }

    const students = users.map((u) => ({
      id: u.id,
      fullName: u.full_name,
      mobile: u.mobile,
      email: u.email,
      skillLevel: u.skill_level ?? 'basic',
      lastActive: u.last_active ?? u.created_at,
      totalWatchTimeSecs: 0,
      quizScore: u.cumulative_score ?? 0,
      enrollmentCount: enrollmentCounts[u.id] ?? 0,
      isBanned: u.is_banned ?? false,
    }));

    return { students, total, page, limit };
  }

  async exportStudentsCsv(filters?: { search?: string }): Promise<string> {
    const result = (await this.getStudents(filters)) as any;
    const students = result.students ?? [];
    const headers = [
      'id',
      'fullName',
      'mobile',
      'email',
      'skillLevel',
      'lastActive',
      'quizScore',
      'enrollmentCount',
      'isBanned',
    ];
    const rows = students.map((s: any) => headers.map((h) => JSON.stringify(s[h] ?? '')).join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  async getTeachers(params?: { page?: number; limit?: number }): Promise<object> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepo
      .createQueryBuilder('u')
      .where('u.role = :role', { role: 'teacher' })
      .orderBy('u.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const teacherIds = users.map((u) => u.id);

    // Batch counts per teacher
    const batchCounts: Record<string, number> = {};
    if (teacherIds.length) {
      const counts = await this.batchRepo
        .createQueryBuilder('b')
        .select('b.teacher_id', 'teacherId')
        .addSelect('COUNT(*)', 'count')
        .where('b.teacher_id IN (:...teacherIds)', { teacherIds })
        .groupBy('b.teacher_id')
        .getRawMany();
      counts.forEach((c: any) => {
        batchCounts[c.teacherId] = Number(c.count);
      });
    }

    const teachers = users.map((u) => ({
      id: u.id,
      fullName: u.full_name,
      mobile: u.mobile?.startsWith('email_') || u.mobile?.startsWith('google_') ? null : u.mobile,
      email: u.email,
      isBanned: u.is_banned ?? false,
      batchCount: batchCounts[u.id] ?? 0,
      joinedAt: u.created_at,
    }));

    return { teachers, total, page, limit };
  }

  async changeUserRole(userId: string, role: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    const validRoles = ['student', 'teacher', 'admin'];
    if (!validRoles.includes(role)) throw new NotFoundException(`Invalid role: ${role}`);
    user.role = role as any;
    return this.userRepo.save(user);
  }

  async banUser(userId: string, reason: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    user.is_banned = true;
    user.ban_reason = reason;
    // Increment session_version to invalidate all existing JWTs immediately
    user.session_version = (user.session_version || 0) + 1;
    const saved = await this.userRepo.save(user);
    // Revoke all refresh tokens
    await this.refreshTokenRepo.update({ user_id: userId, revoked: false }, { revoked: true });
    return saved;
  }

  async unbanUser(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    user.is_banned = false;
    user.ban_reason = null;
    return this.userRepo.save(user);
  }

  async warnUser(userId: string, message: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    user.ban_reason = `[WARNING]: ${message}`;
    await this.userRepo.save(user);
  }

  async invalidateSessions(userId: string): Promise<void> {
    // Increment session_version safely with COALESCE → all existing JWTs become invalid immediately
    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ session_version: () => 'COALESCE(session_version, 0) + 1' })
      .where('id = :id', { id: userId })
      .execute();
    // Also revoke all refresh tokens in DB
    await this.refreshTokenRepo.update({ user_id: userId, revoked: false }, { revoked: true });
  }

  async hideContent(type: string, id: string): Promise<{ message: string }> {
    if (type === 'live') {
      const live = await this.liveClassRepo.findOne({ where: { id } });
      if (!live) throw new NotFoundException(`Live class ${id} not found`);
      live.status = LiveClassStatus.REJECTED;
      await this.liveClassRepo.save(live);
    } else {
      // General repository soft-disable/hide
      const targetRepo =
        type === 'video'
          ? 'recorded_videos'
          : type === 'note'
            ? 'notes'
            : type === 'announcement'
              ? 'announcements'
              : 'doubts';
      await this.userRepo
        .query(`UPDATE ${targetRepo} SET is_active = false WHERE id = $1`, [id])
        .catch(() => {
          throw new NotFoundException(
            `Content ${id} of type ${type} not found or cannot be hidden`,
          );
        });
    }
    return { message: `Content ${id} of type ${type} has been hidden` };
  }

  async deleteContent(type: string, id: string): Promise<{ message: string }> {
    if (type === 'live') {
      const res = await this.liveClassRepo.delete(id);
      if (!res.affected) throw new NotFoundException(`Live class ${id} not found`);
    } else {
      const targetTable =
        type === 'video'
          ? 'recorded_videos'
          : type === 'note'
            ? 'notes'
            : type === 'announcement'
              ? 'announcements'
              : 'doubts';
      await this.userRepo.query(`DELETE FROM ${targetTable} WHERE id = $1`, [id]).catch(() => {
        throw new NotFoundException(`Content ${id} of type ${type} not found or cannot be deleted`);
      });
    }
    return { message: `Content ${id} of type ${type} has been deleted` };
  }

  async getTeacherEarnings(teacherId: string): Promise<object> {
    const teacher = await this.userRepo.findOne({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException(`Teacher ${teacherId} not found`);

    const batches = await this.batchRepo.find({ where: { teacher_id: teacherId } });
    const batchIds = batches.map((b) => b.id);

    if (!batchIds.length) return { teacherId, totalEarnings: 0, transactions: [] };

    const transactions = await this.transactionRepo
      .createQueryBuilder('t')
      .innerJoin('batches', 'b', 'b.id = t.batch_id')
      .where('t.batch_id IN (:...batchIds)', { batchIds })
      .andWhere('t.status = :status', { status: TransactionStatus.SUCCESS })
      .select(['t.id', 't.final_amount', 't.created_at', 'b.revenue_share_pct'])
      .getRawMany();

    const totalEarnings = transactions.reduce((sum, t) => {
      const share = Number(t.b_revenue_share_pct) / 100;
      return sum + Number(t.t_final_amount) * share;
    }, 0);

    return { teacherId, totalEarnings, transactions };
  }

  async createPayout(teacherId: string, amount: number): Promise<TeacherPayout> {
    const teacher = await this.userRepo.findOne({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException(`Teacher ${teacherId} not found`);

    const payout = this.payoutRepo.create({
      teacher_id: teacherId,
      amount,
      status: PayoutStatus.PENDING,
    });
    return this.payoutRepo.save(payout);
  }

  async manualEnroll(studentId: string, batchId: string): Promise<object> {
    const student = await this.userRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException(`Student ${studentId} not found`);

    const batch = await this.batchRepo.findOne({ where: { id: batchId } });
    if (!batch) throw new NotFoundException(`Batch ${batchId} not found`);

    const existing = await this.enrollmentRepo.findOne({
      where: { student_id: studentId, batch_id: batchId },
    });
    if (existing) {
      existing.is_active = true;
      await this.enrollmentRepo.save(existing);
      return { message: 'Enrollment reactivated', studentId, batchId };
    }

    const enrollment = this.enrollmentRepo.create({
      student_id: studentId,
      batch_id: batchId,
      is_active: true,
      expires_at: null,
    });
    await this.enrollmentRepo.save(enrollment);
    return { message: 'Student enrolled successfully', studentId, batchId };
  }

  async getLiveClasses(status?: string): Promise<object[]> {
    const where: any = {};
    if (status) where.status = status as LiveClassStatus;

    const classes = await this.liveClassRepo.find({
      where,
      relations: ['teacher', 'batch'],
      order: { scheduled_at: 'DESC' },
    });

    return classes.map((c) => ({
      id: c.id,
      title: c.title,
      batchTitle: c.batch?.name ?? '',
      teacherName: c.teacher?.full_name ?? '',
      scheduledAt: c.scheduled_at,
      status: c.status,
      youtubeUrl: c.youtube_url,
      youtubeVideoId: c.youtube_video_id,
    }));
  }

  // In-memory fallback for settings when Redis is unavailable
  private settingsCache: Record<string, any> | null = null;

  private getDefaultSettings(): Record<string, any> {
    return {
      platformName: 'allEdu',
      logoUrl: '',
      brandingColor: '#1a56db',
      contactEmail: '',
      socialLinks: { facebook: '', instagram: '', youtube: '', twitter: '' },
      smsGateway: 'msg91',
      smsApiKey: '',
      paymentGateway: 'razorpay',
      razorpayKeyId: '',
      razorpayWebhookSecret: '',
      fcmServerKey: '',
      skillThresholds: { basic: 0, intermediate: 40, advanced: 70, pro: 90 },
      referralRewardType: 'coupon',
      referralRewardValue: 0,
      attendanceWarningThreshold: 75,
      maintenanceMode: false,
    };
  }

  async getSettings(): Promise<object> {
    try {
      const cached = await this.redisService.get('admin:settings');
      if (cached) return JSON.parse(cached);
    } catch {
      // Redis unavailable — use in-memory cache
      if (this.settingsCache) return this.settingsCache;
    }
    return this.getDefaultSettings();
  }

  async updateSettings(patch: Record<string, any>): Promise<object> {
    const current = (await this.getSettings()) as Record<string, any>;
    const updated = { ...current, ...patch };
    this.settingsCache = updated; // always update in-memory
    try {
      await this.redisService.set('admin:settings', JSON.stringify(updated), 60 * 60 * 24 * 365);
    } catch {
      // Redis unavailable — in-memory cache already updated
    }
    return updated;
  }

  async getFlaggedContent(params?: {
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<object> {
    // Placeholder — real implementation would query chat_messages / doubts with flagged=true
    return { items: [], total: 0, page: params?.page ?? 1, limit: params?.limit ?? 20 };
  }
}
