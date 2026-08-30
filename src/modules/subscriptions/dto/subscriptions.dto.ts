import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { MembershipTier, SubscriptionStatus } from '../../../common/enums';
import { PaginationQueryDto } from '../../../common/dto';

export class CreateSubscriptionDto {
  @ApiProperty({ enum: MembershipTier, example: MembershipTier.BASIC })
  @IsEnum(MembershipTier)
  @IsNotEmpty()
  tier: MembershipTier;

  @ApiPropertyOptional({ example: 'pm_card_visa' })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}

export class UpdateSubscriptionDto {
  @ApiProperty({ enum: MembershipTier, example: MembershipTier.STANDARD })
  @IsEnum(MembershipTier)
  @IsNotEmpty()
  newTier: MembershipTier;
}

export class CreatePlanDto {
  @ApiProperty({ enum: MembershipTier, example: MembershipTier.BASIC })
  @IsEnum(MembershipTier)
  tier: MembershipTier;

  @ApiProperty({ example: 'Basic Supplier Plan' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 119.99 })
  @IsNumber()
  @Min(0)
  priceMonthly: number;

  @ApiPropertyOptional({ example: 1199.99 })
  @IsOptional()
  @IsNumber()
  priceAnnually?: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  maxProducts: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  maxMonthlyQuotes: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  verifiedBadge?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  priorityRanking?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  dedicatedSupport?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class SubscriptionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
}
