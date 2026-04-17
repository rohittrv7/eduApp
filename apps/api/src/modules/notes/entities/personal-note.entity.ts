import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('personal_notes')
export class PersonalNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'uuid' })
  student_id: string;

  // No FK constraint — video_id can be recorded_video.id OR live_class.id
  @Column({ type: 'uuid' })
  video_id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 0 })
  timestamp_secs: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
