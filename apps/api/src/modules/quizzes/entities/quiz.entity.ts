import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RecordedVideo } from '../../videos/entities/recorded-video.entity';
import { LiveClass } from '../../live-classes/entities/live-class.entity';
import { User } from '../../users/entities/user.entity';

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RecordedVideo, { nullable: true })
  @JoinColumn({ name: 'video_id' })
  video: RecordedVideo | null;

  @Column({ type: 'uuid', nullable: true })
  video_id: string | null;

  @ManyToOne(() => LiveClass, { nullable: true })
  @JoinColumn({ name: 'live_class_id' })
  live_class: LiveClass | null;

  @Column({ type: 'uuid', nullable: true })
  live_class_id: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ type: 'uuid' })
  teacher_id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'boolean', default: false })
  is_mandatory: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 90.0 })
  unlock_threshold: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
