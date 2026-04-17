import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Chapter } from '../../content/entities/chapter.entity';
import { RecordedVideo } from '../../videos/entities/recorded-video.entity';
import { Batch } from '../../batches/entities/batch.entity';

export enum StudyMaterialType {
  PDF = 'pdf',
  IMAGE = 'image',
  TEXT = 'text',
}

@Entity('study_materials')
export class StudyMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ type: 'uuid' })
  teacher_id: string;

  /** Batch this material belongs to (for listing by batch) */
  @ManyToOne(() => Batch, { nullable: true })
  @JoinColumn({ name: 'batch_id' })
  batch: Batch | null;

  @Column({ type: 'uuid', nullable: true })
  batch_id: string | null;

  @ManyToOne(() => Chapter, { nullable: true })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter | null;

  @Column({ type: 'uuid', nullable: true })
  chapter_id: string | null;

  @ManyToOne(() => RecordedVideo, { nullable: true })
  @JoinColumn({ name: 'video_id' })
  video: RecordedVideo | null;

  @Column({ type: 'uuid', nullable: true })
  video_id: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  folder_name: string | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({
    type: 'enum',
    enum: StudyMaterialType,
  })
  type: StudyMaterialType;

  @Column({ type: 'text', nullable: true })
  file_url: string | null;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'boolean', default: false })
  is_free_preview: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
