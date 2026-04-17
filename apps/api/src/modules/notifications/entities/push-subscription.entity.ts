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

export enum PushPlatform {
  WEB = 'web',
  ANDROID = 'android',
}

@Unique(['user_id', 'endpoint'])
@Entity('push_subscriptions')
export class PushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'text' })
  endpoint: string;

  @Column({ type: 'text' })
  p256dh: string;

  @Column({ type: 'text' })
  auth: string;

  @Column({
    type: 'enum',
    enum: PushPlatform,
    default: PushPlatform.WEB,
  })
  platform: PushPlatform;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
