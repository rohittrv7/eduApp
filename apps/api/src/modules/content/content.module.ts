import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from './entities/subject.entity';
import { Chapter } from './entities/chapter.entity';
import { SubjectsService } from './subjects/subjects.service';
import { SubjectsController } from './subjects/subjects.controller';
import { ChaptersService } from './chapters/chapters.service';
import { ChaptersController } from './chapters/chapters.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subject, Chapter])],
  controllers: [SubjectsController, ChaptersController],
  providers: [SubjectsService, ChaptersService],
  exports: [SubjectsService, ChaptersService],
})
export class ContentModule {}
