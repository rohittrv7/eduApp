import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecordedVideo } from './entities/recorded-video.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';
import { CreateRecordedVideoDto } from './dto/create-recorded-video.dto';
import { UpdateRecordedVideoDto } from './dto/update-recorded-video.dto';
import { isValidYouTubeUrl } from '@educational/utils';
import { LanguagePref } from '../users/entities/user.entity';

function extractYouTubeVideoId(url: string): string {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/,
  );
  return match?.[1] ?? '';
}

@Injectable()
export class RecordedVideosService {
  constructor(
    @InjectRepository(RecordedVideo)
    private readonly videoRepo: Repository<RecordedVideo>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
  ) {}

  async create(
    teacherId: string,
    dto: CreateRecordedVideoDto,
  ): Promise<RecordedVideo> {
    if (!isValidYouTubeUrl(dto.youtube_url)) {
      throw new BadRequestException('Invalid YouTube URL format');
    }

    const video = this.videoRepo.create({
      batch_id: dto.batch_id,
      chapter_id: dto.chapter_id ?? null,
      teacher_id: teacherId,
      title: dto.title,
      description: dto.description ?? null,
      youtube_url: dto.youtube_url,
      youtube_video_id: extractYouTubeVideoId(dto.youtube_url),
      thumbnail: dto.thumbnail ?? null,
      duration_seconds: dto.duration_seconds ?? 0,
      language: dto.language ?? LanguagePref.HINDI,
      is_locked: dto.is_locked ?? false,
      order_index: dto.order_index ?? 0,
    });
    return this.videoRepo.save(video);
  }

  async findAll(batchId?: string): Promise<RecordedVideo[]> {
    const where = batchId ? { batch_id: batchId } : {};
    return this.videoRepo.find({
      where,
      order: { order_index: 'ASC', created_at: 'ASC' },
    });
  }

  async findOne(id: string, userId?: string, userRole?: string): Promise<RecordedVideo> {
    const video = await this.videoRepo.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException(`Video ${id} not found`);
    }

    // Teachers and admins can always access
    if (userRole === 'teacher' || userRole === 'admin') {
      return video;
    }

    // Students must be enrolled
    if (userId) {
      const enrollment = await this.enrollmentRepo.findOne({
        where: { student_id: userId, batch_id: video.batch_id, is_active: true },
      });
      if (!enrollment) {
        throw new ForbiddenException(
          'You must be enrolled in this batch to access this video',
        );
      }
    }

    return video;
  }

  async update(
    id: string,
    teacherId: string,
    dto: UpdateRecordedVideoDto,
  ): Promise<RecordedVideo> {
    const video = await this.videoRepo.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException(`Video ${id} not found`);
    }
    if (video.teacher_id !== teacherId) {
      throw new ForbiddenException('You do not own this video');
    }

    if (dto.youtube_url && !isValidYouTubeUrl(dto.youtube_url)) {
      throw new BadRequestException('Invalid YouTube URL format');
    }

    if (dto.youtube_url) {
      (dto as any).youtube_video_id = extractYouTubeVideoId(dto.youtube_url);
    }

    Object.assign(video, dto);
    return this.videoRepo.save(video);
  }

  async remove(id: string, requesterId: string, requesterRole: string): Promise<void> {
    const video = await this.videoRepo.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException(`Video ${id} not found`);
    }
    if (requesterRole !== 'admin' && video.teacher_id !== requesterId) {
      throw new ForbiddenException('You do not own this video');
    }
    await this.videoRepo.remove(video);
  }
}
