import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto';
import { Incoterm, OrderStatus } from '../../../common/enums';
import { CreateAddressDto } from '../../users/dto';

export class CreateOrderDto {
  @ApiProperty({ type: CreateAddressDto, description: 'Shipping address snapshot' })
  @ValidateNested()
  @Type(() => CreateAddressDto)
  shippingAddress: CreateAddressDto;

  @ApiProperty({ enum: Incoterm, default: Incoterm.FOB, description: 'International Commercial Terms' })
  @IsEnum(Incoterm)
  incoterm: Incoterm;

  @ApiPropertyOptional({ example: 'Port of Los Angeles (USLAX)' })
  @IsOptional()
  @IsString()
  destinationPort?: string;

  @ApiPropertyOptional({ example: 'Please send pre-production golden sample photos before mass assembly.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.IN_PRODUCTION })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;

  @ApiPropertyOptional({ example: 'SMT assembly started for 5,000 units. Estimated completion 10 days.' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class OrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sellerProfileId?: string;
}
