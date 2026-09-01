import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { UserRole } from '../../../common/enums';

export class BankDetailsDto {
  @ApiProperty({ example: 'JPMorgan Chase / HSBC' })
  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @ApiProperty({ example: 'Shenzhen Apex Electronics Co., Ltd' })
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

export class RegisterDto {
  @ApiProperty({ example: 'buyer@daymoon.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @ApiProperty({ example: 'Haniful Islam' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: UserRole, default: UserRole.BUYER, description: 'Role of the new account (BUYER or SELLER)' })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({ example: 'Shenzhen Apex Electronics Co., Ltd', description: 'Business name required if registering as SELLER' })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({ example: 'Manufacturer', description: 'Business type required if registering as SELLER' })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional({ example: 'China', description: 'Country of operation' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    type: BankDetailsDto,
    description: 'Mandatory bank details for payouts when registering as a SELLER',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;
}

export class LoginDto {
  @ApiProperty({ example: 'buyer@daymoon.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh JWT token' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPassword123!' })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ example: 'NewSecurePassword123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
