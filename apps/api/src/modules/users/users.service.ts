import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, LanguagePref, SkillLevel } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { WatchSession } from '../videos/entities/watch-session.entity';
import { QuizAttempt } from '../quizzes/entities/quiz-attempt.entity';
import { StorageService } from '../../common/storage/storage.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(WatchSession)
    private readonly watchSessionRepo: Repository<WatchSession>,
    @InjectRepository(QuizAttempt)
    private readonly quizAttemptRepo: Repository<QuizAttempt>,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {}

  async findByMobile(mobile: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { mobile } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { google_id: googleId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async createUser(data: Partial<User>): Promise<User> {
    const referralCode = await this.generateUniqueReferralCode();
    const user = this.userRepository.create({
      role: UserRole.STUDENT,
      language_pref: LanguagePref.HINDI,
      referral_code: referralCode,
      ...data,
    });
    return this.userRepository.save(user);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    await this.userRepository.update(id, data);
    return this.userRepository.findOneOrFail({ where: { id } });
  }

  async findOrCreateByMobile(mobile: string): Promise<{ user: User; isNewUser: boolean }> {
    let user = await this.findByMobile(mobile);
    let isNewUser = false;

    if (!user) {
      user = await this.createUser({ mobile });
      isNewUser = true;
    }

    return { user, isNewUser };
  }

  async findOrCreateByEmail(email: string): Promise<{ user: User; isNewUser: boolean }> {
    let user = await this.findByEmail(email);
    let isNewUser = false;

    if (!user) {
      // mobile is required in DB — use email-derived placeholder until user links mobile
      const mobilePlaceholder = `email_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
      user = await this.createUser({ email, mobile: mobilePlaceholder });
      isNewUser = true;
    }

    return { user, isNewUser };
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    const updateData: Partial<User> = {};
    if (dto.fullName !== undefined) updateData.full_name = dto.fullName;
    if (dto.classGrade !== undefined) updateData.class_grade = dto.classGrade;
    if (dto.targetExam !== undefined) updateData.target_exam = dto.targetExam;
    if (dto.languagePref !== undefined) updateData.language_pref = dto.languagePref;
    if (dto.examTargetDate !== undefined) updateData.exam_target_date = dto.examTargetDate;
    if (dto.lowBandwidthMode !== undefined) updateData.low_bandwidth_mode = dto.lowBandwidthMode;
    return this.updateUser(id, updateData);
  }

  async uploadProfilePhoto(userId: string, file: Express.Multer.File): Promise<string> {
    const { path, url } = await this.storageService.upload(
      file.buffer,
      `profile-${userId}`,
      '/profiles',
    );
    // Store only the path in DB — full URL built at runtime via StorageService.getUrl()
    await this.updateUser(userId, { profile_photo: path });
    return url;
  }

  private async generateUniqueReferralCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let exists: User | null;

    do {
      code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      exists = await this.userRepository.findOne({ where: { referral_code: code } });
    } while (exists);

    return code;
  }

  async getStats(userId: string): Promise<{
    totalWatchTimeSecs: number;
    quizAvgScore: number;
    quizzesAttempted: number;
    videosWatched: number;
  }> {
    const [watchResult, quizResult, quizCount, videoCount] = await Promise.all([
      this.watchSessionRepo
        .createQueryBuilder('ws')
        .select('SUM(ws.watch_time_secs)', 'total')
        .where('ws.student_id = :userId', { userId })
        .getRawOne(),
      this.quizAttemptRepo
        .createQueryBuilder('qa')
        .select('AVG(qa.percentage)', 'avg')
        .where('qa.student_id = :userId', { userId })
        .getRawOne(),
      this.quizAttemptRepo.count({ where: { student_id: userId } }),
      this.watchSessionRepo
        .createQueryBuilder('ws')
        .select('COUNT(DISTINCT ws.video_id)', 'count')
        .where('ws.student_id = :userId AND ws.video_id IS NOT NULL', { userId })
        .getRawOne(),
    ]);

    return {
      totalWatchTimeSecs: watchResult?.total ? parseInt(watchResult.total, 10) : 0,
      quizAvgScore: quizResult?.avg ? parseFloat(parseFloat(quizResult.avg).toFixed(1)) : 0,
      quizzesAttempted: quizCount,
      videosWatched: videoCount?.count ? parseInt(videoCount.count, 10) : 0,
    };
  }

  async getWeeklyProgress(userId: string): Promise<object[]> {
    const promises = Array.from({ length: 7 }, (_, index) => {
      const i = 6 - index;
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      return Promise.all([
        this.watchSessionRepo
          .createQueryBuilder('ws')
          .select('SUM(ws.watch_time_secs)', 'total')
          .where('ws.student_id = :userId AND ws.session_date = :date', { userId, date: dateStr })
          .getRawOne(),
        this.quizAttemptRepo
          .createQueryBuilder('qa')
          .select('AVG(qa.percentage)', 'avg')
          .where('qa.student_id = :userId AND DATE(qa.submitted_at) = :date', { userId, date: dateStr })
          .getRawOne(),
      ]).then(([watchResult, quizResult]) => ({
        date: dateStr,
        watchTimeSecs: watchResult?.total ? parseInt(watchResult.total, 10) : 0,
        avgQuizScore: quizResult?.avg ? parseFloat(quizResult.avg) : 0,
      }));
    });

    return Promise.all(promises);
  }

  async getMonthlyProgress(userId: string): Promise<object[]> {
    const promises = Array.from({ length: 4 }, (_, index) => {
      const i = 3 - index;
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);

      return Promise.all([
        this.watchSessionRepo
          .createQueryBuilder('ws')
          .select('SUM(ws.watch_time_secs)', 'total')
          .where('ws.student_id = :userId AND ws.session_date BETWEEN :start AND :end', {
            userId,
            start: weekStart.toISOString().split('T')[0],
            end: weekEnd.toISOString().split('T')[0],
          })
          .getRawOne(),
        this.quizAttemptRepo
          .createQueryBuilder('qa')
          .select('AVG(qa.percentage)', 'avg')
          .where('qa.student_id = :userId AND qa.submitted_at BETWEEN :start AND :end', {
            userId,
            start: weekStart,
            end: weekEnd,
          })
          .getRawOne(),
      ]).then(([watchResult, quizResult]) => ({
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        watchTimeSecs: watchResult?.total ? parseInt(watchResult.total, 10) : 0,
        avgQuizScore: quizResult?.avg ? parseFloat(quizResult.avg) : 0,
      }));
    });

    return Promise.all(promises);
  }

  async updateStreak(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastActive = user.last_active;
    const lastActiveDate = lastActive ? lastActive.toISOString().split('T')[0] : null;

    // Already updated today — skip
    if (lastActiveDate === today) return;

    let newStreak = 1;
    if (lastActiveDate) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      // If last active was yesterday, continue streak
      if (lastActiveDate === yesterdayStr) {
        newStreak = (user.streak_count ?? 0) + 1;
      }
      // else streak resets to 1
    }

    await this.userRepository.update(userId, {
      streak_count: newStreak,
      last_active: now,
    });
  }

  async updateSkillLevel(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error(`User ${userId} not found`);

    const score = user.cumulative_score;
    let skillLevel: SkillLevel;
    if (score >= 1000) skillLevel = SkillLevel.PRO;
    else if (score >= 500) skillLevel = SkillLevel.ADVANCED;
    else if (score >= 200) skillLevel = SkillLevel.INTERMEDIATE;
    else skillLevel = SkillLevel.BASIC;

    user.skill_level = skillLevel;
    return this.userRepository.save(user);
  }
}
