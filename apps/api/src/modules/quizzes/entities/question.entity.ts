import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Quiz } from './quiz.entity';

export enum QuestionType {
  MCQ = 'mcq',
  TRUE_FALSE = 'true_false',
  FILL_BLANK = 'fill_blank',
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Quiz, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quiz;

  @Column({ type: 'uuid' })
  quiz_id: string;

  @Column({ type: 'text' })
  text: string;

  @Column({
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.MCQ,
  })
  type: QuestionType;

  @Column({ type: 'jsonb', nullable: true })
  options: object | null;

  @Column({ type: 'text', nullable: true })
  correct_answer: string | null;

  @Column({ type: 'text', nullable: true })
  explanation: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1 })
  marks: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  negative_marks: number;

  @Column({ type: 'int', nullable: true })
  time_limit_secs: number | null;

  @Column({ type: 'int', default: 0 })
  order_index: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
