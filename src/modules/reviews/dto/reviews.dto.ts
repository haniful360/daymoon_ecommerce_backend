import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto';

export class CreateReviewDto {
  @ApiProperty({ example: 'order-uuid-123' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: 'product-uuid-123' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  productRating: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  supplierRating: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  communicationRating: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  punctualityRating: number;

  @ApiProperty({ example: 'Excellent manufacturing precision. Tolerances matched CAD 100%, and delivery was on schedule.' })
  @IsString()
  @IsNotEmpty()
  comment: string;

  @ApiPropertyOptional({ example: ['https://cdn.daymoon.com/reviews/batch-sample-inspection.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];
}

export class ReplyReviewDto {
  @ApiProperty({ example: 'Thank you for your bulk order and feedback. We look forward to our next production run!' })
  @IsString()
  @IsNotEmpty()
  replyText: string;
}

export class ReviewQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sellerProfileId?: string;
}
