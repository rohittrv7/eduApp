import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doubt, DoubtStatus } from './entities/doubt.entity';
import { DoubtReply } from './entities/doubt-reply.entity';
import { DoubtUpvote } from './entities/doubt-upvote.entity';
import { CreateDoubtDto } from './dto/create-doubt.dto';

@Injectable()
export class DoubtsService {
  constructor(
    @InjectRepository(Doubt)
    private readonly doubtRepo: Repository<Doubt>,
    @InjectRepository(DoubtReply)
    private readonly replyRepo: Repository<DoubtReply>,
    @InjectRepository(DoubtUpvote)
    private readonly upvoteRepo: Repository<DoubtUpvote>,
  ) {}

  async create(studentId: string, dto: CreateDoubtDto): Promise<Doubt> {
    const doubt = this.doubtRepo.create({
      student_id: studentId,
      video_id: dto.video_id ?? null,
      chapter_id: dto.chapter_id ?? null,
      text: dto.text,
      image_url: dto.image_url ?? null,
    });
    return this.doubtRepo.save(doubt);
  }

  async findAll(videoId?: string, chapterId?: string): Promise<Doubt[]> {
    const where: any = { is_hidden: false };
    if (videoId) where.video_id = videoId;
    if (chapterId) where.chapter_id = chapterId;
    return this.doubtRepo.find({
      where,
      relations: ['student'],
      order: { upvotes: 'DESC', created_at: 'DESC' },
    });
  }

  async reply(doubtId: string, authorId: string, text: string): Promise<DoubtReply> {
    const doubt = await this.doubtRepo.findOne({ where: { id: doubtId } });
    if (!doubt) throw new NotFoundException(`Doubt ${doubtId} not found`);
    const reply = this.replyRepo.create({ doubt_id: doubtId, author_id: authorId, text });
    return this.replyRepo.save(reply);
  }

  async upvote(doubtId: string, studentId: string): Promise<void> {
    const doubt = await this.doubtRepo.findOne({ where: { id: doubtId } });
    if (!doubt) throw new NotFoundException(`Doubt ${doubtId} not found`);
    const existing = await this.upvoteRepo.findOne({
      where: { doubt_id: doubtId, student_id: studentId },
    });
    if (existing) throw new ConflictException('Already upvoted');
    await this.upvoteRepo.save({ doubt_id: doubtId, student_id: studentId });
    await this.doubtRepo.increment({ id: doubtId }, 'upvotes', 1);
  }

  async resolve(doubtId: string, requesterId: string, requesterRole: string): Promise<Doubt> {
    const doubt = await this.doubtRepo.findOne({ where: { id: doubtId } });
    if (!doubt) throw new NotFoundException(`Doubt ${doubtId} not found`);
    if (requesterRole !== 'admin' && requesterRole !== 'teacher' && doubt.student_id !== requesterId) {
      throw new ForbiddenException('Cannot resolve this doubt');
    }
    doubt.status = DoubtStatus.RESOLVED;
    return this.doubtRepo.save(doubt);
  }
}
