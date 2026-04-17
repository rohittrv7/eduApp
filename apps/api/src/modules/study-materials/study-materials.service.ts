import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { StudyMaterial } from './entities/study-material.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';
import { RecordedVideo } from '../videos/entities/recorded-video.entity';
import { CreateStudyMaterialDto } from './dto/create-study-material.dto';
import { StorageService } from '../../common/storage/storage.service';

@Injectable()
export class StudyMaterialsService {
  constructor(
    @InjectRepository(StudyMaterial)
    private readonly materialRepo: Repository<StudyMaterial>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(RecordedVideo)
    private readonly videoRepo: Repository<RecordedVideo>,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {}

  /** Upload file to storage, return { path, url } */
  async uploadFile(file: Express.Multer.File, teacherId: string): Promise<{ path: string; url: string }> {
    try {
      const result = await this.storageService.upload(
        file.buffer,
        file.originalname,
        `study-materials/${teacherId}`,
      );
      return result;
    } catch (err) {
      // Fallback: store as base64 data URL (dev mode when ImageKit is unavailable)
      const base64 = file.buffer.toString('base64');
      const mimeType = file.mimetype || 'application/pdf';
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return { path: dataUrl, url: dataUrl };
    }
  }

  async create(
    teacherId: string,
    dto: CreateStudyMaterialDto,
  ): Promise<StudyMaterial> {
    const material = this.materialRepo.create({
      teacher_id: teacherId,
      batch_id: dto.batch_id ?? null,
      chapter_id: dto.chapter_id ?? null,
      video_id: dto.video_id ?? null,
      folder_name: dto.folder_name ?? null,
      title: dto.title,
      type: dto.type,
      file_url: dto.file_url ?? null,
      content: dto.content ?? null,
      is_free_preview: dto.is_free_preview ?? false,
    });
    return this.materialRepo.save(material);
  }

  /** List all materials for a batch.
   * - Teacher: sees all
   * - Student: sees free_preview + enrolled-only materials (if enrolled)
   */
  async findByBatch(batchId: string, userId: string, userRole: string): Promise<StudyMaterial[]> {
    const all = await this.materialRepo.find({
      where: { batch_id: batchId },
      order: { created_at: 'ASC' },
    });

    if (userRole === 'teacher' || userRole === 'admin') return all;

    // Check enrollment
    const enrollment = await this.enrollmentRepo.findOne({
      where: { student_id: userId, batch_id: batchId, is_active: true },
    });

    if (enrollment) return all; // enrolled → see everything

    // Not enrolled → only free preview
    return all.filter((m) => m.is_free_preview);
  }

  async findOne(id: string): Promise<StudyMaterial> {
    const material = await this.materialRepo.findOne({ where: { id } });
    if (!material) {
      throw new NotFoundException(`Study material ${id} not found`);
    }
    return material;
  }

  async remove(id: string, requesterId: string, requesterRole: string): Promise<void> {
    const material = await this.findOne(id);
    if (requesterRole !== 'admin' && material.teacher_id !== requesterId) {
      throw new ForbiddenException('You do not own this study material');
    }
    await this.materialRepo.remove(material);
  }

  async getSignedUrl(materialId: string, userId: string, userRole: string): Promise<{ url: string; expires_at: Date }> {
    const material = await this.findOne(materialId);

    if (!material.file_url) {
      throw new NotFoundException('No file associated with this study material');
    }

    // data: URL (dev fallback) — return directly, no signing needed
    if (material.file_url.startsWith('data:')) {
      return { url: material.file_url, expires_at: new Date(Date.now() + 30 * 60 * 1000) };
    }

    // Free preview — anyone can access
    if (material.is_free_preview) {
      const url = this.storageService.getSignedUrl(material.file_url, 1800);
      return { url, expires_at: new Date(Date.now() + 30 * 60 * 1000) };
    }

    // Paid material — check enrollment for students
    if (userRole === 'student') {
      const batchId = material.batch_id ?? (await this.resolveBatchId(material));
      if (batchId) {
        const enrollment = await this.enrollmentRepo.findOne({
          where: { student_id: userId, batch_id: batchId, is_active: true },
        });
        if (!enrollment) {
          throw new ForbiddenException('You must be enrolled in this batch to access this material');
        }
      }
    }

    const url = this.storageService.getSignedUrl(material.file_url, 1800);
    return { url, expires_at: new Date(Date.now() + 30 * 60 * 1000) };
  }

  private async resolveBatchId(material: StudyMaterial): Promise<string | null> {
    if (material.video_id) {
      const video = await this.videoRepo.findOne({ where: { id: material.video_id } });
      return video?.batch_id ?? null;
    }
    return null;
  }
}
