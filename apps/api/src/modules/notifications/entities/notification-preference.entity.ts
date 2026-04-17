import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryColumn({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'boolean', default: true })
  live_class_reminders: boolean;

  @Column({ type: 'boolean', default: true })
  doubt_replies: boolean;

  @Column({ type: 'boolean', default: true })
  new_announcements: boolean;

  @Column({ type: 'boolean', default: true })
  quiz_results: boolean;

  @Column({ type: 'boolean', default: true })
  leaderboard_updates: boolean;

  @Column({ type: 'boolean', default: true })
  new_batch_launches: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
