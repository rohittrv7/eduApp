import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Batch } from './batch.entity';

@Unique(['student_id', 'batch_id'])
@Index('idx_enrollments_student', ['student_id'])
@Index('idx_enrollments_batch', ['batch_id'])
@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'uuid' })
  student_id: string;

  @ManyToOne(() => Batch)
  @JoinColumn({ name: 'batch_id' })
  batch: Batch;

  @Column({ type: 'uuid' })
  batch_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  enrolled_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}
