import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TestSeries } from './test-series.entity';

@Entity('mock_tests')
export class MockTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TestSeries)
  @JoinColumn({ name: 'test_series_id' })
  test_series: TestSeries;

  @Column({ type: 'uuid' })
  test_series_id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subject: string | null;

  @Column({ type: 'int' })
  duration_mins: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  total_marks: number;

  @Column({ type: 'jsonb', nullable: true })
  negative_marking_rules: object | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
