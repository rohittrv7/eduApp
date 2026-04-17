import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Doubt } from './doubt.entity';

@Entity('doubt_upvotes')
export class DoubtUpvote {
  @PrimaryColumn({ type: 'uuid' })
  student_id: string;

  @PrimaryColumn({ type: 'uuid' })
  doubt_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @ManyToOne(() => Doubt)
  @JoinColumn({ name: 'doubt_id' })
  doubt: Doubt;
}
