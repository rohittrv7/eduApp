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
import { Transaction } from './transaction.entity';

export enum RewardType {
  COUPON = 'coupon',
  CASHBACK = 'cashback',
}

@Unique(['referrer_id', 'referred_id'])
@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'referrer_id' })
  referrer: User;

  @Column({ type: 'uuid' })
  referrer_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'referred_id' })
  referred: User;

  @Column({ type: 'uuid' })
  referred_id: string;

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction | null;

  @Column({ type: 'uuid', nullable: true })
  transaction_id: string | null;

  @Column({
    type: 'enum',
    enum: RewardType,
    nullable: true,
  })
  reward_type: RewardType | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  reward_value: number | null;

  @Column({ type: 'boolean', default: false })
  reward_issued: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
