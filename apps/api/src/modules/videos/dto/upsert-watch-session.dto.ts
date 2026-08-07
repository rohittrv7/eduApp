import { IsNumber, IsOptional, Min, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

function toSafeInt(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : Math.floor(n);
}

export class UpsertWatchSessionDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => toSafeInt(value))
  watch_time_secs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => toSafeInt(value))
  watchTimeSecs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => toSafeInt(value))
  last_position?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => toSafeInt(value))
  lastPosition?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => toSafeInt(value))
  duration_seconds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => toSafeInt(value))
  durationSeconds?: number;
}
