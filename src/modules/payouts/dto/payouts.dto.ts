import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto';
import { PayoutStatus } from '../../../common/enums';

export class RequestPayoutDto {
  @ApiProperty({ example: 12500.00, description: 'Withdrawal amount in USD' })
  @IsNumber()
  @Min(50.00)
  amount: number;

  @ApiProperty({ example: 'BANK_WIRE', enum: ['BANK_WIRE', 'SWIFT', 'ACH', 'STRIPE', 'PAYPAL'] })
  @IsString()
  @IsNotEmpty()
  payoutMethod: any;

  @ApiProperty({
    example: {
      bankName: 'Standard Chartered Bank Hong Kong',
      swiftCode: 'SCBLHKHHXXX',
      accountNumber: '88899900012345',
      accountHolderName: 'Shenzhen Precision Electronics Co., Ltd.',
    },
    description: 'Bank Wire / SWIFT / ACH Account Details',
  })
  @IsObject()
  payoutAccountDetails: Record<string, any>;
}

export class ProcessPayoutDto {
  @ApiProperty({ enum: ['COMPLETED', 'REJECTED'] })
  @IsEnum(PayoutStatus)
  status: PayoutStatus;

  @ApiPropertyOptional({ example: 'TXN-SWIFT-20260829-9948' })
  @IsOptional()
  @IsString()
  transactionReference?: string;

  @ApiPropertyOptional({ example: 'Wire transfer processed via HSBC clearing.' })
  @IsOptional()
  @IsString()
  adminNote?: string;
}

export class PayoutQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PayoutStatus })
  @IsOptional()
  @IsEnum(PayoutStatus)
  status?: PayoutStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sellerProfileId?: string;
}
