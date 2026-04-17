import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Index('idx_watch_sessions_student_video', ['student_id', 'video_id'])
@Entity('watch_sessions')
export class WatchSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'uuid' })
  student_id: string;

  @Column({ type: 'uuid', nullable: true })
  video_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  live_class_id: string | null;

  @Column({ type: 'int', default: 0 })
  watch_time_secs: number;

  @Column({ type: 'int', default: 0 })
  last_position: number;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'date' })
  session_date: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
