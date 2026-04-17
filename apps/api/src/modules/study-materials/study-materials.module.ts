import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StudyMaterial } from './entities/study-material.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';
import { RecordedVideo } from '../videos/entities/recorded-video.entity';
import { StudyMaterialsService } from './study-materials.service';
import { StudyMaterialsController } from './study-materials.controller';
import { StorageModule } from '../../common/storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudyMaterial, Enrollment, RecordedVideo]),
    MulterModule.register({ storage: memoryStorage() }),
    StorageModule,
  ],
  controllers: [StudyMaterialsController],
  providers: [StudyMaterialsService],
  exports: [StudyMaterialsService],
})
export class StudyMaterialsModule {}
