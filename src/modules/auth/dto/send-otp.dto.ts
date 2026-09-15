import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    example: 'buyer@daymoon.com',
    description: 'Email address where OTP will be sent',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiPropertyOptional({
    example: 'Haniful Islam',
    description: 'Name of the recipient to personalize the email template',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
