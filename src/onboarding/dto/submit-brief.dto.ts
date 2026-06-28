import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class SubmitBriefDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  niche!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  pain!: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  currentChannels?: string[];

  @IsString()
  @MaxLength(500)
  @IsOptional()
  goal?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  audience?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  competitors?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  monthlyBudgetRub?: number;
}
