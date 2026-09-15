import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { BankDetailsDto } from './bank-details.dto';

export class UpdateSellerProfileDto {
  @ApiPropertyOptional({ example: 'Daymoon Global Sourcing Ltd' })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({ example: 'Manufacturer & Exporter' })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional({ example: 'Updated business description' })
  @IsOptional()
  @IsString()
  businessDescription?: string;

  @ApiPropertyOptional({ example: 'Bangladesh' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'TAX-BD-987654321' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== null && value !== ''
      ? Number(value)
      : undefined,
  )
  @IsInt()
  @Min(0)
  yearsInBusiness?: number;

  @ApiPropertyOptional({ example: '35,000 sq. meters' })
  @IsOptional()
  @IsString()
  factorySize?: string;

  @ApiPropertyOptional({ example: '50-100 People' })
  @IsOptional()
  @IsString()
  rdStaffCount?: string;

  @ApiPropertyOptional({ example: '14 Days Return Policy' })
  @IsOptional()
  @IsString()
  returnPolicy?: string;

  @ApiPropertyOptional({ example: ['NATIONAL', 'INTERNATIONAL'] })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return value
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    return value;
  })
  shippingRegions?: string[];

  @ApiPropertyOptional({ example: ['FOB', 'CIF', 'DDP'] })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return value
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    return value;
  })
  tradeTerms?: string[];

  @ApiPropertyOptional({ example: { website: 'https://daymoon.com' } })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }
    return value;
  })
  socialLinks?: Record<string, any>;

  @ApiPropertyOptional({ type: BankDetailsDto })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  storeLogo?: any;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  storeBanner?: any;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  verificationDocuments?: any;
}
