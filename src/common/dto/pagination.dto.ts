import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search keyword query' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort field name' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc', description: 'Sort direction' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 20);
  }

  get take(): number {
    return this.limit ?? 20;
  }
}

export class PaginationMetaDto {
  @ApiPropertyOptional({ example: 100 })
  total: number;

  @ApiPropertyOptional({ example: 1 })
  page: number;

  @ApiPropertyOptional({ example: 20 })
  limit: number;

  @ApiPropertyOptional({ example: 5 })
  totalPages: number;

  constructor(total: number, page: number, limit: number) {
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  }
}
