import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Announcement } from './announcement.entity';

@Entity('announcement_reads')
export class AnnouncementRead {
  @PrimaryColumn({ type: 'uuid' })
  student_id: string;

  @PrimaryColumn({ type: 'uuid' })
  announcement_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @ManyToOne(() => Announcement)
  @JoinColumn({ name: 'announcement_id' })
  announcement: Announcement;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  read_at: Date;
}
