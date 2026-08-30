import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiPropertyOptional({ example: 'Operation completed successfully' })
  message?: string;

  @ApiPropertyOptional()
  data?: T;

  @ApiPropertyOptional()
  meta?: any;

  @ApiProperty({ example: '2026-08-29T12:00:00.000Z' })
  timestamp: string;
}
