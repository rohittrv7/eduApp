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
import { Batch } from '../../batches/entities/batch.entity';

@Unique(['student_id', 'batch_id'])
@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'uuid' })
  student_id: string;

  @ManyToOne(() => Batch)
  @JoinColumn({ name: 'batch_id' })
  batch: Batch;

  @Column({ type: 'uuid' })
  batch_id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  certificate_uid: string;

  @CreateDateColumn({ type: 'timestamptz' })
  issued_at: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  pdf_url: string | null;
}
