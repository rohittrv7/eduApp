import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Transaction } from '../payments/entities/transaction.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';
import { TeacherPayout } from '../payments/entities/teacher-payout.entity';
import { Batch } from '../batches/entities/batch.entity';
import { LiveClass } from '../live-classes/entities/live-class.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Transaction,
      Enrollment,
      TeacherPayout,
      Batch,
      LiveClass,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
