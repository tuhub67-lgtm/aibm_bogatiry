import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Каналы публикации. Приоритет MVP — Telegram (spec п.3). */
export const PUBLISH_CHANNELS = ['telegram', 'vk'] as const;
export type PublishChannel = (typeof PUBLISH_CHANNELS)[number];

export class SchedulePostDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(PUBLISH_CHANNELS, { each: true })
  channels!: PublishChannel[];

  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  text!: string;

  /** Время публикации (ISO 8601). Без него — ближайший слот очереди. */
  @IsISO8601()
  @IsOptional()
  scheduledAt?: string;
}
