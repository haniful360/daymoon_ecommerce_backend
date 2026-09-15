import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BankDetailsDto {
  @ApiProperty({ example: 'JPMorgan Chase / Standard Chartered' })
  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @ApiProperty({ example: 'Daymoon International Trading Ltd' })
  @IsString()
  @IsNotEmpty()
  accountHolderName!: string;

  @ApiProperty({ example: '987654321098' })
  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @ApiProperty({ example: 'CHASUS33' })
  @IsString()
  @IsNotEmpty()
  swiftCode!: string;

  @ApiPropertyOptional({ example: '021000021' })
  @IsOptional()
  @IsString()
  routingNumber?: string;

  @ApiPropertyOptional({ example: 'United States' })
  @IsOptional()
  @IsString()
  bankCountry?: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;
}
