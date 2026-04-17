import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from './entities/certificate.entity';
import { WatchSession } from '../videos/entities/watch-session.entity';
import { RecordedVideo } from '../videos/entities/recorded-video.entity';
import { QuizAttempt } from '../quizzes/entities/quiz-attempt.entity';
import { Quiz } from '../quizzes/entities/quiz.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private readonly certRepo: Repository<Certificate>,
    @InjectRepository(WatchSession)
    private readonly watchSessionRepo: Repository<WatchSession>,
    @InjectRepository(RecordedVideo)
    private readonly videoRepo: Repository<RecordedVideo>,
    @InjectRepository(QuizAttempt)
    private readonly quizAttemptRepo: Repository<QuizAttempt>,
    @InjectRepository(Quiz)
    private readonly quizRepo: Repository<Quiz>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
  ) {}

  async checkEligibility(studentId: string, batchId: string): Promise<boolean> {
    // Check enrollment
    const enrollment = await this.enrollmentRepo.findOne({
      where: { student_id: studentId, batch_id: batchId, is_active: true },
    });
    if (!enrollment) return false;

    // Check watch-time >= 80% for all batch videos
    const videos = await this.videoRepo.find({ where: { batch_id: batchId } });
    for (const video of videos) {
      if (video.duration_seconds === 0) continue;
      const result = await this.watchSessionRepo
        .createQueryBuilder('ws')
        .select('SUM(ws.watch_time_secs)', 'total')
        .where('ws.student_id = :studentId AND ws.video_id = :videoId', {
          studentId,
          videoId: video.id,
        })
        .getRawOne();
      const totalWatch = result?.total ? parseInt(result.total, 10) : 0;
      const pct = (totalWatch / video.duration_seconds) * 100;
      if (pct < 80) return false;
    }

    // Check all mandatory quizzes passed
    const mandatoryQuizzes = await this.quizRepo
      .createQueryBuilder('q')
      .innerJoin('recorded_videos', 'v', 'v.id = q.video_id AND v.batch_id = :batchId', { batchId })
      .where('q.is_mandatory = true')
      .getMany();

    for (const quiz of mandatoryQuizzes) {
      const attempt = await this.quizAttemptRepo.findOne({
        where: { student_id: studentId, quiz_id: quiz.id },
        order: { percentage: 'DESC' },
      });
      if (!attempt || Number(attempt.percentage) < 50) return false;
    }

    return true;
  }

  async generate(studentId: string, batchId: string): Promise<Certificate> {
    const eligible = await this.checkEligibility(studentId, batchId);
    if (!eligible) {
      throw new BadRequestException('Student is not eligible for certificate');
    }

    const existing = await this.certRepo.findOne({
      where: { student_id: studentId, batch_id: batchId },
    });
    if (existing) return existing;

    const uid = `CERT-${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`;
    const cert = this.certRepo.create({
      student_id: studentId,
      batch_id: batchId,
      certificate_uid: uid,
      pdf_url: null,
    });
    return this.certRepo.save(cert);
  }

  async verify(uid: string): Promise<Certificate> {
    const cert = await this.certRepo.findOne({
      where: { certificate_uid: uid },
      relations: ['student', 'batch'],
    });
    if (!cert) throw new NotFoundException(`Certificate ${uid} not found`);
    return cert;
  }
}
