import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certificate } from './entities/certificate.entity';
import { WatchSession } from '../videos/entities/watch-session.entity';
import { RecordedVideo } from '../videos/entities/recorded-video.entity';
import { QuizAttempt } from '../quizzes/entities/quiz-attempt.entity';
import { Quiz } from '../quizzes/entities/quiz.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Certificate, WatchSession, RecordedVideo, QuizAttempt, Quiz, Enrollment]),
  ],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
