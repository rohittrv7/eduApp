import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Batch } from './entities/batch.entity';
import { Enrollment } from './entities/enrollment.entity';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { slugify } from '@educational/utils';
import { RecordedVideo } from '../videos/entities/recorded-video.entity';
import { Subject } from '../content/entities/subject.entity';
import { Chapter } from '../content/entities/chapter.entity';
import { LiveClass, LiveClassStatus } from '../live-classes/entities/live-class.entity';

@Injectable()
export class BatchesService {
  constructor(
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(RecordedVideo)
    private readonly videoRepo: Repository<RecordedVideo>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(Chapter)
    private readonly chapterRepo: Repository<Chapter>,
    @InjectRepository(LiveClass)
    private readonly liveClassRepo: Repository<LiveClass>,
  ) {}

  async create(teacherId: string, dto: CreateBatchDto): Promise<Batch> {
    const slug = await this.generateUniqueSlug(dto.name);
    const batch = this.batchRepo.create({
      teacher_id: teacherId,
      name: dto.name,
      slug,
      description: dto.description ?? null,
      target_exam: dto.target_exam ?? null,
      language: dto.language,
      price: dto.price ?? 0,
      is_free: dto.is_free ?? (dto.price === 0 || dto.price === undefined),
      trial_days: dto.trial_days ?? 0,
      capacity: dto.capacity ?? null,
      thumbnail: dto.thumbnail ?? null,
      start_date: dto.start_date ?? null,
      end_date: dto.end_date ?? null,
    });
    return this.batchRepo.save(batch);
  }

  async findByTeacher(teacherId: string): Promise<Batch[]> {
    return this.batchRepo.find({
      where: { teacher_id: teacherId, is_active: true },
      order: { created_at: 'DESC' },
    });
  }

  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{ data: Batch[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.batchRepo.findAndCount({
      where: { is_active: true },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findBySlug(slug: string): Promise<Batch> {
    const batch = await this.batchRepo.findOne({ where: { slug } });
    if (!batch) {
      throw new NotFoundException(`Batch "${slug}" not found`);
    }
    return batch;
  }

  async findBySlugWithEnrollment(slug: string, userId?: string): Promise<any> {
    // Support both slug and UUID lookup
    let batch: Batch | null = null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(slug)) {
      batch = await this.batchRepo.findOne({ where: { id: slug } });
    } else {
      batch = await this.batchRepo.findOne({ where: { slug } });
    }
    if (!batch) {
      throw new NotFoundException(`Batch "${slug}" not found`);
    }

    let isEnrolled = false;
    if (userId) {
      const enrollment = await this.enrollmentRepo.findOne({
        where: { student_id: userId, batch_id: batch.id, is_active: true },
      });
      isEnrolled = !!enrollment;
    }

    // Load all videos for this batch
    const videos = await this.videoRepo.find({
      where: { batch_id: batch.id },
      order: { order_index: 'ASC', created_at: 'ASC' },
    });

    // Group videos by chapter_id
    const videosByChapter = new Map<string | null, RecordedVideo[]>();
    for (const v of videos) {
      const key = v.chapter_id ?? null;
      if (!videosByChapter.has(key)) videosByChapter.set(key, []);
      videosByChapter.get(key)!.push(v);
    }

    // Load only chapters that have videos or live classes in this batch
    const chapterIdsWithVideos = [...new Set(
      videos.filter(v => v.chapter_id).map(v => v.chapter_id!)
    )];

    // Pre-load ended live classes once (reuse below)
    const endedLiveClasses = await this.liveClassRepo.find({
      where: { batch_id: batch.id, status: LiveClassStatus.ENDED },
      order: { scheduled_at: 'DESC' },
    });
    const liveChapterIds = endedLiveClasses
      .filter(lc => lc.chapter_id)
      .map(lc => lc.chapter_id!);

    const allRelevantChapterIds = [...new Set([...chapterIdsWithVideos, ...liveChapterIds])];

    const allChapters = allRelevantChapterIds.length > 0
      ? await this.chapterRepo.find({
          where: { id: In(allRelevantChapterIds) },
          order: { order_index: 'ASC', created_at: 'ASC' },
        })
      : [];

    // Load only subjects that have relevant chapters
    const subjectIdsWithContent = [...new Set(allChapters.map(c => c.subject_id))];
    const allSubjects = subjectIdsWithContent.length > 0
      ? await this.subjectRepo.find({
          where: { id: In(subjectIdsWithContent) },
          order: { created_at: 'ASC' },
        })
      : [];

    // Build subject → chapters → videos tree
    const subjectMap = new Map<string, any>();
    for (const s of allSubjects) {
      subjectMap.set(s.id, {
        id: s.id,
        name: s.name,
        description: s.description,
        chapters: [],
      });
    }

    for (const c of allChapters) {
      const chapterVideos = videosByChapter.get(c.id) ?? [];
      const chapterData = {
        id: c.id,
        name: c.name,
        order: c.order_index,
        videos: chapterVideos.map(v => ({
          id: v.id,
          title: v.title,
          thumbnail: v.thumbnail,
          durationSeconds: v.duration_seconds,
          isLocked: v.is_locked,
        })),
      };
      const subj = subjectMap.get(c.subject_id);
      if (subj) subj.chapters.push(chapterData);
    }

    const subjects: any[] = [...subjectMap.values()].map(s => ({
      ...s,
      chapters: s.chapters.sort((a: any, b: any) => a.order - b.order),
    }));

    // Videos without chapter — put in a default "General" subject
    const uncategorizedVideos = videosByChapter.get(null) ?? [];
    // Also videos whose chapter_id doesn't match any loaded chapter
    const loadedChapterIds = new Set(allChapters.map(c => c.id));
    for (const [chapId, vids] of videosByChapter) {
      if (chapId !== null && !loadedChapterIds.has(chapId)) {
        uncategorizedVideos.push(...vids);
      }
    }
    if (uncategorizedVideos.length > 0) {
      subjects.push({
        id: 'uncategorized',
        name: 'General',
        chapters: [{
          id: 'uncategorized-chapter',
          name: 'Videos',
          order: 0,
          videos: uncategorizedVideos.map(v => ({
            id: v.id,
            title: v.title,
            thumbnail: v.thumbnail,
            durationSeconds: v.duration_seconds,
            isLocked: v.is_locked,
          })),
        }],
      });
    }

    // endedLiveClasses already loaded above — use directly
    if (endedLiveClasses.length > 0) {
      // Group ended classes by chapter_id
      const liveByChapterId = new Map<string | null, LiveClass[]>();
      for (const lc of endedLiveClasses) {
        const key = lc.chapter_id ?? null;
        if (!liveByChapterId.has(key)) liveByChapterId.set(key, []);
        liveByChapterId.get(key)!.push(lc);
      }

      // 1. Add chapter-assigned live classes to their chapters
      for (const subject of subjects) {
        for (const chapter of subject.chapters) {
          const cls = liveByChapterId.get(chapter.id) ?? [];
          for (const lc of cls) {
            chapter.videos.push({
              id: lc.id, title: lc.title, thumbnail: null,
              durationSeconds: 0, isLocked: false,
              isLiveRecording: true, youtubeVideoId: lc.youtube_video_id,
            });
          }
          if (cls.length) liveByChapterId.delete(chapter.id);
        }
      }

      // 2. null chapter_id classes → match by subject_id, then first subject
      const nullClasses = liveByChapterId.get(null) ?? [];
      if (nullClasses.length > 0) {
        for (const lc of nullClasses) {
          const liveVideo = {
            id: lc.id, title: lc.title, thumbnail: null,
            durationSeconds: 0, isLocked: false,
            isLiveRecording: true, youtubeVideoId: lc.youtube_video_id,
          };

          // Try to match by subject_id first
          const matchedSubject = (lc as any).subject_id
            ? subjects.find(s => s.id === (lc as any).subject_id)
            : null;

          const targetSubject = matchedSubject
            ?? subjects.find(s => s.id !== 'live-recordings' && s.id !== 'uncategorized')
            ?? subjects[0];

          if (targetSubject) {
            if (targetSubject.chapters.length > 0) {
              targetSubject.chapters[0].videos.push(liveVideo);
            } else {
              targetSubject.chapters.push({
                id: `live-classes-chapter-${targetSubject.id}`,
                name: 'Live Classes',
                order: 0,
                videos: [liveVideo],
              });
            }
          } else {
            // No subjects — create Live Recordings
            let liveRec = subjects.find(s => s.id === 'live-recordings');
            if (!liveRec) {
              liveRec = { id: 'live-recordings', name: 'Live Recordings', chapters: [{ id: 'live-recordings-chapter', name: 'Recorded Classes', order: 0, videos: [] }] };
              subjects.push(liveRec);
            }
            liveRec.chapters[0].videos.push(liveVideo);
          }
        }
        liveByChapterId.delete(null);
      }

      // 3. Any remaining (chapter_id set but chapter not in tree) → Live Recordings
      const remaining: LiveClass[] = [];
      for (const [, cls] of liveByChapterId) remaining.push(...cls);
      if (remaining.length > 0) {
        subjects.push({
          id: 'live-recordings',
          name: 'Live Recordings',
          chapters: [{
            id: 'live-recordings-chapter', name: 'Recorded Classes', order: 0,
            videos: remaining.map(lc => ({
              id: lc.id, title: lc.title, thumbnail: null,
              durationSeconds: 0, isLocked: false,
              isLiveRecording: true, youtubeVideoId: lc.youtube_video_id,
            })),
          }],
        });
      }
    }

    return { ...batch, isEnrolled, subjects };
  }

  async findOne(id: string): Promise<Batch> {
    const batch = await this.batchRepo.findOne({ where: { id } });
    if (!batch) {
      throw new NotFoundException(`Batch ${id} not found`);
    }
    return batch;
  }

  async update(
    id: string,
    requesterId: string,
    requesterRole: string,
    dto: UpdateBatchDto,
  ): Promise<Batch> {
    const batch = await this.findOne(id);
    if (requesterRole !== 'admin' && batch.teacher_id !== requesterId) {
      throw new ForbiddenException('You do not own this batch');
    }
    Object.assign(batch, dto);
    return this.batchRepo.save(batch);
  }

  async remove(id: string): Promise<void> {
    const batch = await this.findOne(id);
    await this.batchRepo.remove(batch);
  }

  async enroll(studentId: string, batchId: string): Promise<Enrollment> {
    const batch = await this.findOne(batchId);

    if (!batch.is_free) {
      throw new BadRequestException(
        'This batch requires payment. Use the payment flow to enroll.',
      );
    }

    const existing = await this.enrollmentRepo.findOne({
      where: { student_id: studentId, batch_id: batchId },
    });
    if (existing) {
      throw new ConflictException('You are already enrolled in this batch');
    }

    if (batch.capacity !== null) {
      const enrolledCount = await this.enrollmentRepo.count({
        where: { batch_id: batchId, is_active: true },
      });
      if (enrolledCount >= batch.capacity) {
        throw new ConflictException('Batch Full');
      }
    }

    const enrollment = this.enrollmentRepo.create({
      student_id: studentId,
      batch_id: batchId,
      is_active: true,
      expires_at: batch.trial_days > 0
        ? new Date(Date.now() + batch.trial_days * 24 * 60 * 60 * 1000)
        : null,
    });
    return this.enrollmentRepo.save(enrollment);
  }

  async findEnrolledByStudent(studentId: string): Promise<Batch[]> {
    const enrollments = await this.enrollmentRepo.find({
      where: { student_id: studentId, is_active: true },
      relations: ['batch'],
    });
    return enrollments
      .map((e) => e.batch)
      .filter((b) => b && b.is_active);
  }

  async toggleFeatured(batchId: string): Promise<Batch> {
    const batch = await this.findOne(batchId);
    batch.is_featured = !batch.is_featured;
    return this.batchRepo.save(batch);
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    let slug = base;
    let counter = 1;
    while (await this.batchRepo.findOne({ where: { slug } })) {
      slug = `${base}-${counter++}`;
    }
    return slug;
  }
}
