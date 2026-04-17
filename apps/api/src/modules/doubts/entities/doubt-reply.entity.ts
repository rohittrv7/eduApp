import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Doubt } from './doubt.entity';
import { User } from '../../users/entities/user.entity';

@Entity('doubt_replies')
export class DoubtReply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Doubt, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doubt_id' })
  doubt: Doubt;

  @Column({ type: 'uuid' })
  doubt_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ type: 'uuid' })
  author_id: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url: string | null;

  @Column({ type: 'boolean', default: false })
  is_hidden: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
