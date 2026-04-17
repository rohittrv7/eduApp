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
import { LiveClass } from './live-class.entity';

@Unique(['student_id', 'live_class_id'])
@Entity('attendance')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'uuid' })
  student_id: string;

  @ManyToOne(() => LiveClass)
  @JoinColumn({ name: 'live_class_id' })
  live_class: LiveClass;

  @Column({ type: 'uuid' })
  live_class_id: string;

  @Column({ type: 'boolean', default: false })
  is_present: boolean;

  @Column({ type: 'int', default: 0 })
  watch_time_secs: number;

  @Column({ type: 'timestamptz', nullable: true })
  joined_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
