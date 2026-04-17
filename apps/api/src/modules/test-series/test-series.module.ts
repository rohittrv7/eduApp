import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestSeries } from './entities/test-series.entity';
import { MockTest } from './entities/mock-test.entity';
import { MockTestAttempt } from './entities/mock-test-attempt.entity';
import { User } from '../users/entities/user.entity';
import { TestSeriesService } from './test-series.service';
import { TestSeriesController } from './test-series.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TestSeries, MockTest, MockTestAttempt, User])],
  controllers: [TestSeriesController],
  providers: [TestSeriesService],
  exports: [TestSeriesService],
})
export class TestSeriesModule {}
