import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { LiveClass } from '../../live-classes/entities/live-class.entity';
import { User } from '../../users/entities/user.entity';

export enum PollStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
}

@Entity('live_polls')
export class LivePoll {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LiveClass)
  @JoinColumn({ name: 'live_class_id' })
  live_class: LiveClass;

  @Column({ type: 'uuid' })
  live_class_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ type: 'uuid' })
  teacher_id: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'jsonb' })
  options: object;

  @Column({ type: 'varchar', length: 50, nullable: true })
  correct_option_id: string | null;

  @Column({ type: 'int', default: 30 })
  duration_secs: number;

  @Column({
    type: 'enum',
    enum: PollStatus,
    default: PollStatus.ACTIVE,
  })
  status: PollStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  closed_at: Date | null;
}
