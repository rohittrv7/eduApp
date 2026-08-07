import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { AnnouncementRead } from './entities/announcement-read.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
    @InjectRepository(AnnouncementRead)
    private readonly readRepo: Repository<AnnouncementRead>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
  ) {}

  async create(authorId: string, dto: CreateAnnouncementDto): Promise<Announcement> {
    const announcement = this.announcementRepo.create({
      author_id: authorId,
      batch_id: dto.batch_id ?? null,
      title: dto.title,
      content: dto.content,
      is_important: dto.is_important ?? false,
    });
    return this.announcementRepo.save(announcement);
  }

  async findAll(batchId?: string, userId?: string, userRole?: string): Promise<Announcement[]> {
    // Teachers and admins can see all announcements
    if (userRole === 'teacher' || userRole === 'admin') {
      const where: any = {};
      if (batchId) where.batch_id = batchId;
      return this.announcementRepo.find({ where, order: { created_at: 'DESC' } });
    }

    // Students: if batchId provided, verify enrollment
    if (batchId && userId) {
      const enrolled = await this.enrollmentRepo.findOne({
        where: { student_id: userId, batch_id: batchId, is_active: true },
      });
      if (!enrolled) throw new ForbiddenException('You are not enrolled in this batch');
      return this.announcementRepo.find({
        where: { batch_id: batchId },
        order: { created_at: 'DESC' },
      });
    }

    // Students without batchId: return only announcements for their enrolled batches
    if (userId) {
      const enrollments = await this.enrollmentRepo.find({
        where: { student_id: userId, is_active: true },
      });
      const batchIds = enrollments.map((e) => e.batch_id);
      if (batchIds.length === 0) return [];
      return this.announcementRepo
        .createQueryBuilder('a')
        .where('a.batch_id IN (:...batchIds) OR a.batch_id IS NULL', { batchIds })
        .orderBy('a.created_at', 'DESC')
        .getMany();
    }

    // Require authentication — unauthenticated requests cannot view announcements
    throw new ForbiddenException('Authentication required to view announcements');
  }

  async markRead(announcementId: string, studentId: string): Promise<void> {
    const announcement = await this.announcementRepo.findOne({ where: { id: announcementId } });
    if (!announcement) throw new NotFoundException(`Announcement ${announcementId} not found`);

    // Verify student is enrolled if announcement is batch-specific
    if (announcement.batch_id && studentId) {
      const enrolled = await this.enrollmentRepo.findOne({
        where: { student_id: studentId, batch_id: announcement.batch_id, is_active: true },
      });
      if (!enrolled) throw new ForbiddenException('You are not enrolled in this batch');
    }

    const existing = await this.readRepo.findOne({
      where: { announcement_id: announcementId, student_id: studentId },
    });
    if (!existing) {
      await this.readRepo.save({ announcement_id: announcementId, student_id: studentId });
    }
  }
}
