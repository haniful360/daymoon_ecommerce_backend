import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ example: 'product-uuid-123' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 250, description: 'Order quantity (must meet product MOQ)' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'Custom logo: "Daymoon Tech" on top plate in matte white' })
  @IsOptional()
  @IsString()
  customizationNotes?: string;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 500 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customizationNotes?: string;
}
