import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
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
import { Incoterm, RfqStatus } from '../../../common/enums';

export class RfqAttachmentDto {
  @ApiProperty({ example: 'schematic_drawings_v2.pdf' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ example: 'https://cdn.daymoon.com/rfqs/schematic_drawings_v2.pdf' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({ example: 2048576 })
  @IsOptional()
  @IsInt()
  fileSizeBytes?: number;
}

export class CreateRfqDto {
  @ApiProperty({ example: 'category-uuid-123' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'Sourcing 10,000 units Custom Anodized Aluminum Enclosures for IoT Devices' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Require CNC milled 6061 aluminum alloy enclosure with black matte anodization, laser etched logo, IP67 silicone gasket.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 10000, description: 'Target procurement quantity' })
  @IsInt()
  @Min(1)
  targetQuantity: number;

  @ApiPropertyOptional({ example: 8.50, description: 'Target budget per unit in USD' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  targetUnitPrice?: number;

  @ApiProperty({ enum: Incoterm, default: Incoterm.FOB })
  @IsEnum(Incoterm)
  incoterm: Incoterm;

  @ApiPropertyOptional({ example: 'Hamburg Port, Germany' })
  @IsOptional()
  @IsString()
  destinationPort?: string;

  @ApiPropertyOptional({ example: '2026-12-01' })
  @IsOptional()
  @IsString()
  targetDeliveryDate?: string;

  @ApiPropertyOptional({ example: 30, description: 'RFQ expiration window in days (default 30)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInDays?: number;

  @ApiPropertyOptional({ type: [RfqAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RfqAttachmentDto)
  attachments?: RfqAttachmentDto[];
}

export class CreateQuoteDto {
  @ApiProperty({ example: 7.95, description: 'Quoted unit price in USD' })
  @IsNumber()
  @Min(0.01)
  unitPrice: number;

  @ApiProperty({ example: 5000, description: 'Minimum order quantity offered' })
  @IsInt()
  @Min(1)
  moqOffered: number;

  @ApiPropertyOptional({ example: 7, description: 'Prototype / sample lead time in days' })
  @IsOptional()
  @IsInt()
  sampleLeadDays?: number;

  @ApiProperty({ example: 20, description: 'Mass production lead time in days' })
  @IsInt()
  @Min(1)
  productionLeadDays: number;

  @ApiProperty({ enum: Incoterm, default: Incoterm.FOB })
  @IsEnum(Incoterm)
  incotermOffered: Incoterm;

  @ApiPropertyOptional({ example: 'Ningbo Port, China' })
  @IsOptional()
  @IsString()
  shippingPort?: string;

  @ApiPropertyOptional({ example: '30% T/T deposit, 70% before shipment after inspection' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional({ example: 14, description: 'Quote validity in days' })
  @IsOptional()
  @IsInt()
  validityDays?: number;

  @ApiPropertyOptional({ example: 'We have 15 years experience in CNC aluminum machining. Free tooling inspection included.' })
  @IsOptional()
  @IsString()
  sellerNotes?: string;
}

export class RfqQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: RfqStatus })
  @IsOptional()
  @IsEnum(RfqStatus)
  status?: RfqStatus;
}
