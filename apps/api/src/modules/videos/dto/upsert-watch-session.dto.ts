import { IsInt, IsOptional, Min } from 'class-validator';

export class UpsertWatchSessionDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  watch_time_secs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  watchTimeSecs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  last_position?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lastPosition?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration_seconds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;
}
