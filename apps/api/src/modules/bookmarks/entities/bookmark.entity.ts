import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RecordedVideo } from '../../videos/entities/recorded-video.entity';

@Entity('bookmarks')
export class Bookmark {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'uuid' })
  student_id: string;

  @ManyToOne(() => RecordedVideo)
  @JoinColumn({ name: 'video_id' })
  video: RecordedVideo;

  @Column({ type: 'uuid' })
  video_id: string;

  @Column({ type: 'int' })
  timestamp_secs: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  label: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
