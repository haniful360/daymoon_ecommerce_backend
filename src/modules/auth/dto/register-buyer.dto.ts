import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class RegisterBuyerDto {
  @ApiProperty({
    example: 'Haniful Islam',
    description: 'Buyer full name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @ApiProperty({
    example: 'buyer@daymoon.com',
    description: 'Login email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    minLength: 8,
    description: 'Account password (minimum 8 characters)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @ApiPropertyOptional({
    example: '+8801700000000',
    description: 'Contact phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: '489215',
    description: '6-digit OTP code received in email',
  })
  @IsString()
  @IsNotEmpty({ message: 'Verification OTP is required' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp!: string;
}
