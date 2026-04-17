import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Coupon } from './entities/coupon.entity';
import { TeacherPayout } from './entities/teacher-payout.entity';
import { Batch } from '../batches/entities/batch.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Coupon, TeacherPayout, Batch, Enrollment])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
