import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from '../entities/subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
  ) {}

  async create(teacherId: string, dto: CreateSubjectDto): Promise<Subject> {
    const existing = await this.subjectRepo.findOne({
      where: { teacher_id: teacherId, name: dto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Subject with name "${dto.name}" already exists under your account`,
      );
    }

    const subject = this.subjectRepo.create({
      teacher_id: teacherId,
      name: dto.name,
      description: dto.description ?? null,
    });
    return this.subjectRepo.save(subject);
  }

  async findAll(teacherId: string): Promise<Subject[]> {
    return this.subjectRepo.find({
      where: { teacher_id: teacherId },
      order: { created_at: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Subject> {
    const subject = await this.subjectRepo.findOne({ where: { id } });
    if (!subject) {
      throw new NotFoundException(`Subject ${id} not found`);
    }
    return subject;
  }

  async update(
    id: string,
    teacherId: string,
    dto: UpdateSubjectDto,
  ): Promise<Subject> {
    const subject = await this.findOne(id);
    if (subject.teacher_id !== teacherId) {
      throw new ForbiddenException('You do not own this subject');
    }

    if (dto.name && dto.name !== subject.name) {
      const conflict = await this.subjectRepo.findOne({
        where: { teacher_id: teacherId, name: dto.name },
      });
      if (conflict) {
        throw new ConflictException(
          `Subject with name "${dto.name}" already exists under your account`,
        );
      }
    }

    Object.assign(subject, dto);
    return this.subjectRepo.save(subject);
  }

  async remove(id: string, teacherId: string): Promise<void> {
    const subject = await this.findOne(id);
    if (subject.teacher_id !== teacherId) {
      throw new ForbiddenException('You do not own this subject');
    }
    await this.subjectRepo.remove(subject);
  }
}
