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
import { RecordedVideo } from '../../videos/entities/recorded-video.entity';
import { Chapter } from '../../content/entities/chapter.entity';

export enum DoubtStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
}

@Index('idx_doubts_video', ['video_id'])
@Index('idx_doubts_chapter', ['chapter_id'])
@Entity('doubts')
export class Doubt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'uuid' })
  student_id: string;

  @ManyToOne(() => RecordedVideo, { nullable: true })
  @JoinColumn({ name: 'video_id' })
  video: RecordedVideo | null;

  @Column({ type: 'uuid', nullable: true })
  video_id: string | null;

  @ManyToOne(() => Chapter, { nullable: true })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter | null;

  @Column({ type: 'uuid', nullable: true })
  chapter_id: string | null;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url: string | null;

  @Column({
    type: 'enum',
    enum: DoubtStatus,
    default: DoubtStatus.OPEN,
  })
  status: DoubtStatus;

  @Column({ type: 'int', default: 0 })
  upvotes: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignee: User | null;

  @Column({ type: 'uuid', nullable: true })
  assigned_to: string | null;

  @Column({ type: 'boolean', default: false })
  is_hidden: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
