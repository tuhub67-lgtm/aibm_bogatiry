import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PUBLISH_CHANNELS, PublishChannel } from '../../../posting/channel.types';

export class SchedulePostDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(PUBLISH_CHANNELS, { each: true })
  channels!: PublishChannel[];

  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  text!: string;

  /** Ссылки/идентификаторы медиа. Адаптер усечёт под лимит платформы. */
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  media?: string[];

  /** Время публикации (ISO 8601). Без него — ближайший слот очереди. */
  @IsISO8601()
  @IsOptional()
  scheduledAt?: string;
}
