import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

export class FunnelInputDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  impressions?: number;

  @IsInt()
  @Min(0)
  clicks!: number;

  @IsInt()
  @Min(0)
  leads!: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  meetings?: number;

  @IsInt()
  @Min(0)
  deals!: number;

  @IsInt()
  @IsOptional()
  subscriberGrowth?: number;
}

export class MarketingInputDto {
  @IsInt()
  profit!: number;

  @IsInt()
  @Min(0)
  marketingCost!: number;

  @IsInt()
  @Min(0)
  trafficBudget!: number;

  @IsInt()
  @Min(0)
  paidOrders!: number;
}

export class DiagnoseDto {
  @ValidateNested()
  @Type(() => FunnelInputDto)
  funnel!: FunnelInputDto;

  @ValidateNested()
  @Type(() => MarketingInputDto)
  @IsOptional()
  marketing?: MarketingInputDto;
}
