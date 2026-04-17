import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { LivePoll } from './live-poll.entity';
import { User } from '../../users/entities/user.entity';

@Unique(['poll_id', 'student_id'])
@Entity('poll_responses')
export class PollResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LivePoll, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'poll_id' })
  poll: LivePoll;

  @Column({ type: 'uuid' })
  poll_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'uuid' })
  student_id: string;

  @Column({ type: 'varchar', length: 50 })
  option_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
