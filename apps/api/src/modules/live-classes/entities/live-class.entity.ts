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
import { Batch } from '../../batches/entities/batch.entity';
import { User } from '../../users/entities/user.entity';
import { Chapter } from '../../content/entities/chapter.entity';

export enum LiveClassStatus {
  SCHEDULED = 'scheduled',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  ENDED = 'ended',
}

@Index('idx_live_classes_batch_status', ['batch_id', 'status'])
@Entity('live_classes')
export class LiveClass {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Batch)
  @JoinColumn({ name: 'batch_id' })
  batch: Batch;

  @Column({ type: 'uuid' })
  batch_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ type: 'uuid' })
  teacher_id: string;

  @ManyToOne(() => Chapter, { nullable: true })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter | null;

  @Column({ type: 'uuid', nullable: true })
  chapter_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  subject_id: string | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  youtube_url: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  youtube_video_id: string | null;

  @Column({ type: 'timestamptz' })
  scheduled_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  started_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  ended_at: Date | null;

  @Column({
    type: 'enum',
    enum: LiveClassStatus,
    default: LiveClassStatus.SCHEDULED,
  })
  status: LiveClassStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  recording_url: string | null;

  @Column({ type: 'int', default: 0 })
  viewer_count: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
