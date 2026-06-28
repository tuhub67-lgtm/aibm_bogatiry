import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Форматы контента по приоритету конверсии (spec п.6). */
export const CONTENT_FORMATS = [
  'short_video', // короткие вертикальные видео — макс. охват
  'carousel', // карусели/лонгриды — прогрев и конверсия
  'story', // ежедневные сторис — удержание
  'review_post', // отзыв с фото — социальное доказательство
] as const;

export type ContentFormat = (typeof CONTENT_FORMATS)[number];

export class GenerateDraftDto {
  /** Ниша бизнеса (салон/кафе/магазин/локальный сервис). */
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  niche!: string;

  /** Тема/повод поста. */
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  topic!: string;

  @IsIn(CONTENT_FORMATS)
  format!: ContentFormat;

  /** Город/район для локальных триггеров (spec п.6: захват внимания в радиусе 3 км). */
  @IsString()
  @IsOptional()
  @MaxLength(120)
  locality?: string;
}
