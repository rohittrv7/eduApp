import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Batch } from './entities/batch.entity';
import { Enrollment } from './entities/enrollment.entity';
import { BatchesService } from './batches.service';
import { BatchesController } from './batches.controller';
import { RecordedVideo } from '../videos/entities/recorded-video.entity';
import { Subject } from '../content/entities/subject.entity';
import { Chapter } from '../content/entities/chapter.entity';
import { LiveClass } from '../live-classes/entities/live-class.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Batch, Enrollment, RecordedVideo, Subject, Chapter, LiveClass])],
  controllers: [BatchesController],
  providers: [BatchesService],
  exports: [BatchesService],
})
export class BatchesModule {}
