import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { RedisService } from '../../common/redis/redis.service';

const LEADERBOARD_CACHE_KEY = 'leaderboard:top10';
const LEADERBOARD_TTL = 300; // 5 minutes

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly redisService: RedisService,
  ) {}

  async getLeaderboard(requestingStudentId?: string): Promise<{
    entries: object[];
    myRank?: number;
  }> {
    const cached = await this.redisService.get(LEADERBOARD_CACHE_KEY);
    let top10: any[];

    if (cached) {
      top10 = JSON.parse(cached);
    } else {
      const users = await this.userRepo
        .createQueryBuilder('u')
        .select(['u.id', 'u.full_name', 'u.profile_photo', 'u.skill_level', 'u.cumulative_score'])
        .where("u.is_banned = false AND u.role = 'student'")
        .orderBy('u.cumulative_score', 'DESC')
        .limit(10)
        .getMany();

      top10 = users.map((u, idx) => ({
        rank: idx + 1,
        id: u.id,
        full_name: u.full_name,
        profile_photo: u.profile_photo,
        skill_level: u.skill_level,
        cumulative_score: u.cumulative_score,
      }));

      await this.redisService.set(LEADERBOARD_CACHE_KEY, JSON.stringify(top10), LEADERBOARD_TTL);
    }

    let myRank: number | undefined;
    if (requestingStudentId) {
      const inTop10 = top10.find((e: any) => e.id === requestingStudentId);
      if (inTop10) {
        myRank = inTop10.rank;
      } else {
        // Calculate rank outside top 10
        const count = await this.userRepo
          .createQueryBuilder('u')
          .where("u.is_banned = false AND u.role = 'student'")
          .andWhere(
            'u.cumulative_score > (SELECT cumulative_score FROM users WHERE id = :id)',
            { id: requestingStudentId },
          )
          .getCount();
        myRank = count + 1;
      }
    }

    return { entries: top10, myRank };
  }
}
