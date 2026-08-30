import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto';
import { CustomizationType } from '../../../common/enums';

export class TieredPriceDto {
  @ApiProperty({ example: 100, description: 'Minimum quantity for this price bracket' })
  @IsInt()
  @Min(1)
  minQuantity: number;

  @ApiPropertyOptional({ example: 499, description: 'Maximum quantity for this price bracket (null for open-ended bracket)' })
  @IsOptional()
  @IsInt()
  maxQuantity?: number;

  @ApiProperty({ example: 15.50, description: 'Unit price per piece in USD' })
  @IsNumber()
  @Min(0.01)
  unitPrice: number;
}

export class CustomizationOptionDto {
  @ApiProperty({ enum: CustomizationType, example: CustomizationType.CUSTOM_LOGO })
  @IsEnum(CustomizationType)
  customizationType: CustomizationType;

  @ApiProperty({ example: 500, description: 'Minimum order quantity required for this customization' })
  @IsInt()
  @Min(1)
  minMoq: number;

  @ApiPropertyOptional({ example: 0.50, description: 'Additional cost per unit in USD' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  extraCostPerUnit?: number;

  @ApiPropertyOptional({ example: 'Laser engraving / silk screen printing' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ProductImageDto {
  @ApiProperty({ example: 'https://cdn.daymoon.com/products/smt-board-1.jpg' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isThumbnail?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'category-uuid-123' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'Industrial ESP32 IoT Development Gateway Board' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'DM-ESP32-V2' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: 'High-performance dual-core ESP32 industrial gateway board with RS485, CAN bus, and Ethernet.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 100, description: 'Minimum Order Quantity (MOQ)' })
  @IsInt()
  @Min(1)
  moq: number;

  @ApiPropertyOptional({ example: 25.00, description: 'Sample unit price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  samplePrice?: number;

  @ApiPropertyOptional({ example: 15, description: 'Production lead time in days' })
  @IsOptional()
  @IsInt()
  @Min(1)
  leadTimeDays?: number;

  @ApiProperty({ example: 'China' })
  @IsString()
  @IsNotEmpty()
  originCountry: string;

  @ApiPropertyOptional({ example: 'Shenzhen Port / Yantian' })
  @IsOptional()
  @IsString()
  portOfDispatch?: string;

  @ApiPropertyOptional({ example: 'Anti-static ESD vacuum packaging, 50 pcs per export carton' })
  @IsOptional()
  @IsString()
  packagingDetails?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isCustomizable?: boolean;

  @ApiProperty({ type: [ProductImageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images: ProductImageDto[];

  @ApiProperty({ type: [TieredPriceDto], description: 'Tiered volume pricing table' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TieredPriceDto)
  tieredPrices: TieredPriceDto[];

  @ApiPropertyOptional({ type: [CustomizationOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomizationOptionDto)
  customizations?: CustomizationOptionDto[];
}

export class UpdateProductDto extends CreateProductDto {}

export class ProductQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sellerProfileId?: string;

  @ApiPropertyOptional({ description: 'Max MOQ filter' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxMoq?: number;

  @ApiPropertyOptional({ description: 'Filter products offering OEM customizations' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isCustomizable?: boolean;

  @ApiPropertyOptional({ description: 'Origin country' })
  @IsOptional()
  @IsString()
  originCountry?: string;
}
