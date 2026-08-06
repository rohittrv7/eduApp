import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveClass, LiveClassStatus } from './entities/live-class.entity';
import { Attendance } from './entities/attendance.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';
import { RecordedVideo } from '../videos/entities/recorded-video.entity';
import { RedisService } from '../../common/redis/redis.service';
import { CreateLiveClassDto } from './dto/create-live-class.dto';
import { ReminderCron } from '../notifications/reminder.cron';

function isValidYouTubeUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|live\/|embed\/|shorts\/)[\w-]+|youtu\.be\/[\w-]+)/.test(
    url,
  );
}

function extractYouTubeVideoId(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([\w-]+)/);
  return match?.[1] ?? '';
}

@Injectable()
export class LiveClassesService {
  constructor(
    @InjectRepository(LiveClass)
    private readonly liveClassRepo: Repository<LiveClass>,
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(RecordedVideo)
    private readonly videoRepo: Repository<RecordedVideo>,
    private readonly redisService: RedisService,
    private readonly reminderCron: ReminderCron,
  ) {}

  async create(teacherId: string, dto: CreateLiveClassDto): Promise<LiveClass> {
    if (!isValidYouTubeUrl(dto.youtube_url)) {
      throw new BadRequestException('Invalid YouTube URL format');
    }
    const liveClass = this.liveClassRepo.create({
      teacher_id: teacherId,
      batch_id: dto.batch_id,
      chapter_id: dto.chapter_id ?? null,
      subject_id: dto.subject_id ?? null,
      title: dto.title,
      description: dto.description ?? null,
      youtube_url: dto.youtube_url,
      youtube_video_id: extractYouTubeVideoId(dto.youtube_url),
      scheduled_at: new Date(dto.scheduled_at),
      status: LiveClassStatus.APPROVED,
    });
    const savedClass = await this.liveClassRepo.save(liveClass);
    this.reminderCron.scheduleReminderForClass(savedClass);
    return savedClass;
  }

  async approve(id: string): Promise<LiveClass> {
    const liveClass = await this.findOne(id);
    liveClass.status = LiveClassStatus.APPROVED;
    const savedClass = await this.liveClassRepo.save(liveClass);
    this.reminderCron.scheduleReminderForClass(savedClass);
    return savedClass;
  }

  async reject(id: string, reason?: string): Promise<LiveClass> {
    const liveClass = await this.findOne(id);
    liveClass.status = LiveClassStatus.REJECTED;
    this.reminderCron.cancelReminderForClass(id);
    return this.liveClassRepo.save(liveClass);
  }

  async findUpcoming(studentId: string): Promise<LiveClass[]> {
    // Get batches student is enrolled in
    const enrollments = await this.enrollmentRepo.find({
      where: { student_id: studentId, is_active: true },
    });
    const batchIds = enrollments.map((e) => e.batch_id);
    if (batchIds.length === 0) return [];

    return this.liveClassRepo
      .createQueryBuilder('lc')
      .where('lc.batch_id IN (:...batchIds)', { batchIds })
      .andWhere('lc.status IN (:...statuses)', {
        statuses: [LiveClassStatus.ACTIVE, LiveClassStatus.APPROVED],
      })
      .orderBy('lc.scheduled_at', 'ASC')
      .getMany();
  }

  async findAll(batchId?: string, status?: LiveClassStatus): Promise<LiveClass[]> {
    const where: any = {};
    if (batchId) where.batch_id = batchId;
    if (status) where.status = status;
    return this.liveClassRepo.find({
      where,
      order: { scheduled_at: 'DESC' },
    });
  }

  async findByTeacher(teacherId: string): Promise<LiveClass[]> {
    return this.liveClassRepo.find({
      where: { teacher_id: teacherId },
      relations: ['batch'],
      order: { scheduled_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LiveClass> {
    const liveClass = await this.liveClassRepo.findOne({
      where: { id },
      relations: ['batch'],
    });
    if (!liveClass) {
      throw new NotFoundException(`Live class ${id} not found`);
    }
    return liveClass;
  }

  async updateLiveClass(
    id: string,
    requesterId: string,
    requesterRole: string,
    data: { scheduled_at?: string; title?: string; description?: string; youtube_url?: string },
  ): Promise<LiveClass> {
    const liveClass = await this.findOne(id);
    if (requesterRole !== 'admin' && liveClass.teacher_id !== requesterId) {
      throw new ForbiddenException('You do not own this live class');
    }
    if (liveClass.status === LiveClassStatus.ACTIVE || liveClass.status === LiveClassStatus.ENDED) {
      throw new BadRequestException('Cannot edit a live or ended class');
    }
    if (data.scheduled_at) liveClass.scheduled_at = new Date(data.scheduled_at);
    if (data.title) liveClass.title = data.title;
    if (data.description !== undefined) liveClass.description = data.description;
    if (data.youtube_url) {
      if (!isValidYouTubeUrl(data.youtube_url))
        throw new BadRequestException('Invalid YouTube URL');
      liveClass.youtube_url = data.youtube_url;
      liveClass.youtube_video_id = extractYouTubeVideoId(data.youtube_url);
    }
    return this.liveClassRepo.save(liveClass);
  }

  async goLive(id: string, teacherId: string): Promise<LiveClass> {
    const liveClass = await this.findOne(id);
    if (liveClass.teacher_id !== teacherId) {
      throw new ForbiddenException('You do not own this live class');
    }
    if (liveClass.status !== LiveClassStatus.APPROVED) {
      throw new BadRequestException('Live class must be approved before going live');
    }
    const now = new Date();
    const scheduledAt = new Date(liveClass.scheduled_at);
    const diffMs = scheduledAt.getTime() - now.getTime();
    const diffMins = diffMs / 60000;
    // Reject if more than 15 minutes before scheduled time
    if (diffMins > 15) {
      throw new BadRequestException('Cannot go live more than 15 minutes before scheduled time');
    }
    liveClass.status = LiveClassStatus.ACTIVE;
    liveClass.started_at = now;
    return this.liveClassRepo.save(liveClass);
  }

  async endLive(id: string, teacherId: string): Promise<LiveClass> {
    const liveClass = await this.findOne(id);
    if (liveClass.teacher_id !== teacherId) {
      throw new ForbiddenException('You do not own this live class');
    }
    liveClass.status = LiveClassStatus.ENDED;
    liveClass.ended_at = new Date();
    return this.liveClassRepo.save(liveClass);
  }

  async deleteLiveClass(id: string, teacherId: string): Promise<void> {
    const liveClass = await this.findOne(id);
    if (liveClass.teacher_id !== teacherId) {
      throw new ForbiddenException('You do not own this live class');
    }
    if (liveClass.status === LiveClassStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete an active live class. End it first.');
    }
    await this.liveClassRepo.remove(liveClass);
  }

  async getViewerCount(id: string): Promise<{ count: number }> {
    // Try Redis first, fallback to 0 (Socket.io room size is the source of truth)
    const raw = await this.redisService.get(`live:viewers:${id}`);
    const redisCount = raw ? parseInt(raw, 10) : 0;
    // Also check attendance table for students who joined
    const attendanceCount = await this.attendanceRepo.count({
      where: { live_class_id: id, is_present: true },
    });
    return { count: Math.max(redisCount, attendanceCount) };
  }

  async join(classId: string, studentId: string): Promise<Attendance> {
    const liveClass = await this.findOne(classId);
    const enrollment = await this.enrollmentRepo.findOne({
      where: { student_id: studentId, batch_id: liveClass.batch_id, is_active: true },
    });
    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled in this batch to join');
    }
    const existing = await this.attendanceRepo.findOne({
      where: { student_id: studentId, live_class_id: classId },
    });
    if (existing) {
      if (!existing.joined_at) {
        existing.joined_at = new Date();
        return this.attendanceRepo.save(existing);
      }
      return existing;
    }
    const attendance = this.attendanceRepo.create({
      student_id: studentId,
      live_class_id: classId,
      joined_at: new Date(),
      is_present: true,
    });
    return this.attendanceRepo.save(attendance);
  }

  async getAttendance(classId: string): Promise<Attendance[]> {
    return this.attendanceRepo.find({
      where: { live_class_id: classId },
      relations: ['student'],
    });
  }

  async attachRecording(classId: string, recordingUrl: string): Promise<LiveClass> {
    const liveClass = await this.findOne(classId);
    liveClass.recording_url = recordingUrl;
    const saved = await this.liveClassRepo.save(liveClass);

    // Create a RecordedVideo entry for the recording
    const video = this.videoRepo.create({
      batch_id: liveClass.batch_id,
      chapter_id: liveClass.chapter_id,
      teacher_id: liveClass.teacher_id,
      title: liveClass.title,
      description: liveClass.description,
      youtube_url: recordingUrl,
      youtube_video_id: extractYouTubeVideoId(recordingUrl),
      duration_seconds: 0,
    });
    await this.videoRepo.save(video);

    return saved;
  }
}
