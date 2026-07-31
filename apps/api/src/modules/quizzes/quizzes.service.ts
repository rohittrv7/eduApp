import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from './entities/quiz.entity';
import { Question } from './entities/question.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { User } from '../users/entities/user.entity';
import { WatchSession } from '../videos/entities/watch-session.entity';
import { RecordedVideo } from '../videos/entities/recorded-video.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepo: Repository<Quiz>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(QuizAttempt)
    private readonly attemptRepo: Repository<QuizAttempt>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(WatchSession)
    private readonly watchSessionRepo: Repository<WatchSession>,
    @InjectRepository(RecordedVideo)
    private readonly videoRepo: Repository<RecordedVideo>,
  ) {}

  async findAll(): Promise<any[]> {
    const quizzes = await this.quizRepo.find({
      order: { created_at: 'DESC' },
    });

    const result = [];
    for (const q of quizzes) {
      const questionCount = await this.questionRepo.count({ where: { quiz_id: q.id } });
      result.push({
        ...q,
        questionCount,
      });
    }
    return result;
  }

  async create(teacherId: string, dto: CreateQuizDto): Promise<Quiz> {
    if (dto.questions) {
      for (const q of dto.questions) {
        const opts = q.options as any[];
        if (!opts || opts.length < 2 || opts.length > 6) {
          throw new BadRequestException('Each question must have 2-6 options');
        }
      }
    }

    const quiz = this.quizRepo.create({
      teacher_id: teacherId,
      video_id: dto.video_id ?? null,
      live_class_id: dto.live_class_id ?? null,
      title: dto.title,
      is_mandatory: dto.is_mandatory ?? false,
      unlock_threshold: dto.unlock_threshold ?? 90,
    });
    const saved = await this.quizRepo.save(quiz);

    if (dto.questions?.length) {
      const questions = dto.questions.map((q, idx) =>
        this.questionRepo.create({
          quiz_id: saved.id,
          text: q.text,
          type: (q.type as any) ?? 'mcq',
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation ?? null,
          marks: q.marks ?? 1,
          negative_marks: q.negative_marks ?? 0,
          order_index: idx,
        }),
      );
      await this.questionRepo.save(questions);
    }

    return saved;
  }

  async getQuiz(id: string, studentId?: string): Promise<{ quiz: Quiz; questions: Question[] }> {
    const quiz = await this.quizRepo.findOne({ where: { id } });
    if (!quiz) {
      throw new NotFoundException(`Quiz ${id} not found`);
    }

    // Check watch-time threshold for students
    if (studentId && quiz.video_id) {
      const video = await this.videoRepo.findOne({ where: { id: quiz.video_id } });
      if (video && video.duration_seconds > 0) {
        const result = await this.watchSessionRepo
          .createQueryBuilder('ws')
          .select('SUM(ws.watch_time_secs)', 'total')
          .where('ws.student_id = :studentId AND ws.video_id = :videoId', {
            studentId,
            videoId: quiz.video_id,
          })
          .getRawOne();
        const totalWatch = result?.total ? parseInt(result.total, 10) : 0;
        const progressPct = (totalWatch / video.duration_seconds) * 100;
        if (progressPct < quiz.unlock_threshold) {
          throw new ForbiddenException(
            `Watch at least ${quiz.unlock_threshold}% of the video to unlock this quiz (current: ${progressPct.toFixed(1)}%)`,
          );
        }
      }
    }

    const questions = await this.questionRepo.find({
      where: { quiz_id: id },
      order: { order_index: 'ASC' },
    });

    return { quiz, questions };
  }

  async update(id: string, teacherId: string, dto: Partial<CreateQuizDto>): Promise<Quiz> {
    const quiz = await this.quizRepo.findOne({ where: { id } });
    if (!quiz) throw new NotFoundException(`Quiz ${id} not found`);
    if (quiz.teacher_id !== teacherId) throw new ForbiddenException('You do not own this quiz');
    Object.assign(quiz, dto);
    return this.quizRepo.save(quiz);
  }

  async remove(id: string, requesterId: string, requesterRole: string): Promise<void> {
    const quiz = await this.quizRepo.findOne({ where: { id } });
    if (!quiz) throw new NotFoundException(`Quiz ${id} not found`);
    if (requesterRole !== 'admin' && quiz.teacher_id !== requesterId) {
      throw new ForbiddenException('You do not own this quiz');
    }
    await this.quizRepo.remove(quiz);
  }

  async submitAttempt(
    quizId: string,
    studentId: string,
    dto: SubmitAttemptDto,
  ): Promise<QuizAttempt> {
    const { quiz, questions } = await this.getQuiz(quizId, studentId);

    let score = 0;
    let totalMarks = 0;

    for (const question of questions) {
      const marks = Number(question.marks);
      const negMarks = Number(question.negative_marks);
      totalMarks += marks;
      const studentAnswer = dto.answers[question.id];
      if (studentAnswer !== undefined) {
        if (studentAnswer === question.correct_answer) {
          score += marks;
        } else {
          score -= negMarks;
        }
      }
    }

    score = Math.max(0, score);
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;

    const attempt = this.attemptRepo.create({
      student_id: studentId,
      quiz_id: quizId,
      answers: dto.answers,
      score,
      total_marks: totalMarks,
      percentage,
      submitted_at: new Date(),
    });
    const saved = await this.attemptRepo.save(attempt);

    // Update cumulative score
    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ cumulative_score: () => `cumulative_score + ${Math.round(score)}` })
      .where('id = :id', { id: studentId })
      .execute();

    return saved;
  }

  async getAttempts(quizId: string, studentId: string): Promise<QuizAttempt[]> {
    return this.attemptRepo.find({
      where: { quiz_id: quizId, student_id: studentId },
      order: { created_at: 'DESC' },
    });
  }

  async getRecentAttempts(studentId: string): Promise<any[]> {
    const attempts = await this.attemptRepo
      .createQueryBuilder('qa')
      .leftJoinAndSelect('qa.quiz', 'q')
      .where('qa.student_id = :studentId', { studentId })
      .orderBy('qa.submitted_at', 'DESC')
      .take(10)
      .getMany();

    return attempts.map((a) => ({
      id: a.id,
      quizId: a.quiz_id,
      quizTitle: a.quiz?.title ?? '',
      score: a.score,
      totalMarks: a.total_marks,
      percentage: a.percentage,
      attemptedAt: a.submitted_at,
    }));
  }
}
