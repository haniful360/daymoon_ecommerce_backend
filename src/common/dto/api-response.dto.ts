import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiPropertyOptional({ example: 'Operation completed successfully' })
  message?: string;

  @ApiPropertyOptional()
  data?: T;

  @ApiPropertyOptional()
  meta?: any;

  @ApiProperty({ example: '2026-09-01T10:00:00.000Z' })
  timestamp!: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'Validation failed' })
  message!: string;

  @ApiPropertyOptional({ example: ['email must be a valid email address'] })
  errors?: string[] | Record<string, any> | null;

  @ApiProperty({ example: '/api/v1/auth/register' })
  path!: string;

  @ApiProperty({ example: '2026-09-01T10:00:00.000Z' })
  timestamp!: string;
}
