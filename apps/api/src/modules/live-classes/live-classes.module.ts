import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveClass } from './entities/live-class.entity';
import { Attendance } from './entities/attendance.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';
import { RecordedVideo } from '../videos/entities/recorded-video.entity';
import { LiveClassesService } from './live-classes.service';
import { LiveClassesController } from './live-classes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LiveClass, Attendance, Enrollment, RecordedVideo])],
  controllers: [LiveClassesController],
  providers: [LiveClassesService],
  exports: [LiveClassesService],
})
export class LiveClassesModule {}
