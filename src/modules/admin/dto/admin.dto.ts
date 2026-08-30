import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto';
import { LedgerTransactionType, MembershipTier, VerificationStatus } from '../../../common/enums';

export class VerifySellerDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'], example: 'APPROVED' })
  @IsEnum(VerificationStatus)
  @IsNotEmpty()
  status: VerificationStatus;

  @ApiPropertyOptional({ example: 'Business license and factory inspection audit approved' })
  @IsOptional()
  @IsString()
  auditNotes?: string;

  @ApiPropertyOptional({ description: 'List of document IDs that are verified' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  verifiedDocumentIds?: string[];
}

export class UpdateCommissionRateDto {
  @ApiPropertyOptional({ example: 'category-uuid-123' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: MembershipTier })
  @IsOptional()
  @IsEnum(MembershipTier)
  sellerTier?: MembershipTier;

  @ApiProperty({ example: 4.5, description: 'Commission rate in percent (e.g. 4.5%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRatePercent: number;
}

export class LedgerQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: LedgerTransactionType })
  @IsOptional()
  @IsEnum(LedgerTransactionType)
  transactionType?: LedgerTransactionType;
}
