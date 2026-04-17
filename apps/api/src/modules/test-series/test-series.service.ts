import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestSeries } from './entities/test-series.entity';
import { MockTest } from './entities/mock-test.entity';
import { MockTestAttempt } from './entities/mock-test-attempt.entity';
import { User } from '../users/entities/user.entity';
import { CreateTestSeriesDto } from './dto/create-test-series.dto';
import { CreateMockTestDto } from './dto/create-mock-test.dto';

@Injectable()
export class TestSeriesService {
  constructor(
    @InjectRepository(TestSeries)
    private readonly testSeriesRepo: Repository<TestSeries>,
    @InjectRepository(MockTest)
    private readonly mockTestRepo: Repository<MockTest>,
    @InjectRepository(MockTestAttempt)
    private readonly attemptRepo: Repository<MockTestAttempt>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createTestSeries(teacherId: string, dto: CreateTestSeriesDto): Promise<TestSeries> {
    const ts = this.testSeriesRepo.create({
      teacher_id: teacherId,
      title: dto.title,
      subject: dto.subject ?? null,
      price: dto.price ?? 0,
      is_free: dto.is_free ?? (dto.price === 0 || dto.price === undefined),
    });
    return this.testSeriesRepo.save(ts);
  }

  async findAll(): Promise<TestSeries[]> {
    return this.testSeriesRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<TestSeries> {
    const ts = await this.testSeriesRepo.findOne({ where: { id } });
    if (!ts) throw new NotFoundException(`Test series ${id} not found`);
    return ts;
  }

  async createMockTest(testSeriesId: string, dto: CreateMockTestDto): Promise<MockTest> {
    await this.findOne(testSeriesId);
    const mockTest = this.mockTestRepo.create({
      test_series_id: testSeriesId,
      title: dto.title,
      subject: dto.subject ?? null,
      duration_mins: dto.duration_mins,
      total_marks: dto.total_marks,
      negative_marking_rules: null,
    });
    return this.mockTestRepo.save(mockTest);
  }

  async submitAttempt(
    mockTestId: string,
    studentId: string,
    answers: Record<string, string>,
    autoSubmitted = false,
  ): Promise<MockTestAttempt> {
    const mockTest = await this.mockTestRepo.findOne({ where: { id: mockTestId } });
    if (!mockTest) throw new NotFoundException(`Mock test ${mockTestId} not found`);

    const totalMarks = Number(mockTest.total_marks);
    // Simple scoring: count correct answers from answers object
    // In a real scenario, questions would be fetched and compared
    const score = 0; // placeholder - actual scoring requires questions
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;

    const attempt = this.attemptRepo.create({
      student_id: studentId,
      mock_test_id: mockTestId,
      answers,
      score,
      total_marks: totalMarks,
      percentage,
      auto_submitted: autoSubmitted,
      submitted_at: new Date(),
    });
    const saved = await this.attemptRepo.save(attempt);

    // Calculate rank
    const allAttempts = await this.attemptRepo.find({
      where: { mock_test_id: mockTestId },
      order: { score: 'DESC' },
    });
    const rank = allAttempts.findIndex((a) => a.id === saved.id) + 1;
    saved.rank = rank;
    return this.attemptRepo.save(saved);
  }

  async getAttemptResult(mockTestId: string, attemptId: string): Promise<MockTestAttempt> {
    const attempt = await this.attemptRepo.findOne({
      where: { id: attemptId, mock_test_id: mockTestId },
      relations: ['student'],
    });
    if (!attempt) throw new NotFoundException(`Attempt ${attemptId} not found`);
    return attempt;
  }
}
