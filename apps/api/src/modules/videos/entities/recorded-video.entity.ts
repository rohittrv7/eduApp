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
import { Chapter } from '../../content/entities/chapter.entity';
import { User } from '../../users/entities/user.entity';
import { LanguagePref } from '../../users/entities/user.entity';

@Index('idx_recorded_videos_batch_chapter', ['batch_id', 'chapter_id'])
@Entity('recorded_videos')
export class RecordedVideo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Batch)
  @JoinColumn({ name: 'batch_id' })
  batch: Batch;

  @Column({ type: 'uuid' })
  batch_id: string;

  @ManyToOne(() => Chapter, { nullable: true })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter | null;

  @Column({ type: 'uuid', nullable: true })
  chapter_id: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ type: 'uuid' })
  teacher_id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500 })
  youtube_url: string;

  @Column({ type: 'varchar', length: 50 })
  youtube_video_id: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnail: string | null;

  @Column({ type: 'int', default: 0 })
  duration_seconds: number;

  @Column({
    type: 'enum',
    enum: LanguagePref,
    default: LanguagePref.HINDI,
  })
  language: LanguagePref;

  @Column({ type: 'timestamptz', nullable: true })
  release_date: Date | null;

  @Column({ type: 'boolean', default: false })
  is_locked: boolean;

  @Column({ type: 'int', default: 0 })
  order_index: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
