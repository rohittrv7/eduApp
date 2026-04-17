import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

export enum ParentLinkStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Unique(['parent_id', 'student_id'])
@Entity('parent_links')
export class ParentLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: User;

  @Column({ type: 'uuid' })
  parent_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'uuid' })
  student_id: string;

  @Column({
    type: 'enum',
    enum: ParentLinkStatus,
    default: ParentLinkStatus.PENDING,
  })
  status: ParentLinkStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
