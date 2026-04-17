import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from '../entities/chapter.entity';
import { Subject } from '../entities/subject.entity';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectRepository(Chapter)
    private readonly chapterRepo: Repository<Chapter>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
  ) {}

  async create(teacherId: string, dto: CreateChapterDto): Promise<Chapter> {
    const subject = await this.subjectRepo.findOne({
      where: { id: dto.subject_id },
    });
    if (!subject) {
      throw new NotFoundException(`Subject ${dto.subject_id} not found`);
    }
    if (subject.teacher_id !== teacherId) {
      throw new ForbiddenException('You do not own this subject');
    }

    const chapter = this.chapterRepo.create({
      subject_id: dto.subject_id,
      name: dto.name,
      description: dto.description ?? null,
      order_index: dto.order_index ?? 0,
    });
    return this.chapterRepo.save(chapter);
  }

  async findAll(subjectId?: string): Promise<Chapter[]> {
    const where = subjectId ? { subject_id: subjectId } : {};
    return this.chapterRepo.find({
      where,
      order: { order_index: 'ASC', created_at: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Chapter> {
    const chapter = await this.chapterRepo.findOne({ where: { id } });
    if (!chapter) {
      throw new NotFoundException(`Chapter ${id} not found`);
    }
    return chapter;
  }

  async update(
    id: string,
    teacherId: string,
    dto: UpdateChapterDto,
  ): Promise<Chapter> {
    const chapter = await this.chapterRepo.findOne({
      where: { id },
      relations: ['subject'],
    });
    if (!chapter) {
      throw new NotFoundException(`Chapter ${id} not found`);
    }
    if (chapter.subject.teacher_id !== teacherId) {
      throw new ForbiddenException('You do not own this chapter');
    }

    Object.assign(chapter, dto);
    return this.chapterRepo.save(chapter);
  }

  async remove(id: string, teacherId: string): Promise<void> {
    const chapter = await this.chapterRepo.findOne({
      where: { id },
      relations: ['subject'],
    });
    if (!chapter) {
      throw new NotFoundException(`Chapter ${id} not found`);
    }
    if (chapter.subject.teacher_id !== teacherId) {
      throw new ForbiddenException('You do not own this chapter');
    }
    await this.chapterRepo.remove(chapter);
  }
}
