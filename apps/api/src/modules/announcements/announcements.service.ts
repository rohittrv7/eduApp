import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { AnnouncementRead } from './entities/announcement-read.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
    @InjectRepository(AnnouncementRead)
    private readonly readRepo: Repository<AnnouncementRead>,
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

  async findAll(batchId?: string): Promise<Announcement[]> {
    const where: any = {};
    if (batchId) where.batch_id = batchId;
    return this.announcementRepo.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async markRead(announcementId: string, studentId: string): Promise<void> {
    const announcement = await this.announcementRepo.findOne({ where: { id: announcementId } });
    if (!announcement) throw new NotFoundException(`Announcement ${announcementId} not found`);
    const existing = await this.readRepo.findOne({
      where: { announcement_id: announcementId, student_id: studentId },
    });
    if (!existing) {
      await this.readRepo.save({ announcement_id: announcementId, student_id: studentId });
    }
  }
}
