import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doubt } from './entities/doubt.entity';
import { DoubtReply } from './entities/doubt-reply.entity';
import { DoubtUpvote } from './entities/doubt-upvote.entity';
import { DoubtsService } from './doubts.service';
import { DoubtsController } from './doubts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Doubt, DoubtReply, DoubtUpvote])],
  controllers: [DoubtsController],
  providers: [DoubtsService],
  exports: [DoubtsService],
})
export class DoubtsModule {}
