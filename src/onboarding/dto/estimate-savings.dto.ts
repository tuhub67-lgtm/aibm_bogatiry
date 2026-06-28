import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class EstimateSavingsDto {
  /** Часов в неделю на SMM сейчас (1..168). */
  @IsInt()
  @Min(1)
  @Max(168)
  hoursPerWeek!: number;

  /** Необязательно: своя ставка ₽/час (иначе берётся диапазон 300–500 из spec). */
  @IsInt()
  @Min(0)
  @IsOptional()
  hourlyRateRub?: number;
}
