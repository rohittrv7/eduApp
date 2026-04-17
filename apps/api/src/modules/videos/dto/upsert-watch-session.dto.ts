import { IsInt, IsOptional, Min } from 'class-validator';

export class UpsertWatchSessionDto {
  @IsInt()
  @Min(0)
  watch_time_secs: number;

  @IsInt()
  @Min(0)
  last_position: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration_seconds?: number;
}
