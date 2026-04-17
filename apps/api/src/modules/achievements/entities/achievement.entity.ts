import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Batch } from '../../batches/entities/batch.entity';

export enum BadgeType {
  SEVEN_DAY_STREAK = 'seven_day_streak',
  TOP_10_LEADERBOARD = 'top_10_leaderboard',
  QUIZ_MASTER = 'quiz_master',
  PERFECT_ATTENDANCE = 'perfect_attendance',
}

@Unique(['student_id', 'badge_type', 'batch_id'])
@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'uuid' })
  student_id: string;

  @Column({
    type: 'enum',
    enum: BadgeType,
  })
  badge_type: BadgeType;

  @ManyToOne(() => Batch, { nullable: true })
  @JoinColumn({ name: 'batch_id' })
  batch: Batch | null;

  @Column({ type: 'uuid', nullable: true })
  batch_id: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  earned_at: Date;
}
