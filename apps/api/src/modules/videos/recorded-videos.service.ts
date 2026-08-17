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
import { LanguagePref } from '../users/entities/user.entity';

/**
 * Accepts all common YouTube URL formats:
 * youtube.com/watch?v=ID, m.youtube.com/watch?v=ID,
 * youtube.com/live/ID, youtube.com/embed/ID, youtube.com/shorts/ID, youtu.be/ID,
 * query params in any order, timestamps, etc.
 */
function extractYouTubeVideoId(url: string): string {
  if (!url) return '';
  try {
    const trimmed = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname === 'youtu.be' || hostname.endsWith('.youtu.be')) {
      const id = parsed.pathname.slice(1).split(/[/?#&]/)[0];
      if (id) return id;
    }

    if (hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v) return v;

      const pathParts = parsed.pathname.split('/').filter(Boolean);
      const embedIdx = pathParts.findIndex((p) => ['embed', 'live', 'shorts', 'v'].includes(p));
      const candidate = embedIdx !== -1 ? pathParts[embedIdx + 1] : undefined;
      if (candidate) {
        const id = candidate.split(/[/?#&]/)[0];
        if (id) return id;
      }
    }
  } catch {
    // Fallback regex
  }

  const match = url.match(
    /(?:v=|\/embed\/|\/live\/|\/shorts\/|\/v\/|youtu\.be\/|\/watch\?.*v=)([\w-]{11})/,
  );
  return match?.[1] ?? '';
}

function isValidYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return extractYouTubeVideoId(url).length > 0;
}

@Injectable()
export class RecordedVideosService {
  constructor(
    @InjectRepository(RecordedVideo)
    private readonly videoRepo: Repository<RecordedVideo>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
  ) {}

  async create(teacherId: string, dto: CreateRecordedVideoDto): Promise<RecordedVideo> {
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
        throw new ForbiddenException('You must be enrolled in this batch to access this video');
      }
    }

    return video;
  }

  async update(id: string, teacherId: string, dto: UpdateRecordedVideoDto): Promise<RecordedVideo> {
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
