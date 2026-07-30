import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
  PARENT = 'parent',
}

export enum LanguagePref {
  HINDI = 'hindi',
  ENGLISH = 'english',
  HINGLISH = 'hinglish',
}

export enum SkillLevel {
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  PRO = 'pro',
}

@Index('idx_users_mobile', ['mobile'])
@Index('idx_users_referral_code', ['referral_code'])
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  mobile: string | null;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password_hash: string | null;

  @Column({ type: 'int', default: 1 })
  session_version: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  full_name: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  google_id: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  profile_photo: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  class_grade: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  target_exam: string | null;

  @Column({
    type: 'enum',
    enum: LanguagePref,
    default: LanguagePref.HINDI,
  })
  language_pref: LanguagePref;

  @Column({
    type: 'enum',
    enum: SkillLevel,
    default: SkillLevel.BASIC,
  })
  skill_level: SkillLevel;

  @Column({ type: 'int', default: 0 })
  cumulative_score: number;

  @Column({ type: 'int', default: 0 })
  streak_count: number;

  @Column({ type: 'timestamptz', nullable: true })
  last_active: Date | null;

  @Column({ type: 'boolean', default: false })
  is_banned: boolean;

  @Column({ type: 'text', nullable: true })
  ban_reason: string | null;

  @Column({ type: 'varchar', length: 20, unique: true })
  referral_code: string;

  @Column({ type: 'date', nullable: true })
  exam_target_date: string | null;

  @Column({ type: 'boolean', default: false })
  low_bandwidth_mode: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
