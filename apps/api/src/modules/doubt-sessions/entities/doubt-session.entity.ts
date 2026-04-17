import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DoubtSessionStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Check('"rating" IS NULL OR ("rating" >= 1 AND "rating" <= 5)')
@Entity('doubt_sessions')
export class DoubtSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ type: 'uuid' })
  teacher_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'student_id' })
  student: User | null;

  @Column({ type: 'uuid', nullable: true })
  student_id: string | null;

  @Column({ type: 'timestamptz' })
  scheduled_at: Date;

  @Column({ type: 'int', default: 30 })
  duration_mins: number;

  @Column({
    type: 'enum',
    enum: DoubtSessionStatus,
    default: DoubtSessionStatus.AVAILABLE,
  })
  status: DoubtSessionStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  meet_link: string | null;

  @Column({ type: 'int', nullable: true })
  rating: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
