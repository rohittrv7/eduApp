import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { LiveClass } from '../../live-classes/entities/live-class.entity';
import { User } from '../../users/entities/user.entity';

@Index('idx_chat_messages_live_class', ['live_class_id'])
@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LiveClass)
  @JoinColumn({ name: 'live_class_id' })
  live_class: LiveClass;

  @Column({ type: 'uuid' })
  live_class_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ type: 'uuid' })
  sender_id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: false })
  is_pinned: boolean;

  @Column({ type: 'boolean', default: false })
  is_hidden: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
