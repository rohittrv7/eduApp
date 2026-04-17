import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MockTest } from './mock-test.entity';

@Index('idx_mock_test_attempts_student', ['student_id', 'mock_test_id'])
@Entity('mock_test_attempts')
export class MockTestAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'uuid' })
  student_id: string;

  @ManyToOne(() => MockTest)
  @JoinColumn({ name: 'mock_test_id' })
  mock_test: MockTest;

  @Column({ type: 'uuid' })
  mock_test_id: string;

  @Column({ type: 'jsonb' })
  answers: object;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  score: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  total_marks: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  percentage: number;

  @Column({ type: 'int', nullable: true })
  rank: number | null;

  @Column({ type: 'boolean', default: false })
  auto_submitted: boolean;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  submitted_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
