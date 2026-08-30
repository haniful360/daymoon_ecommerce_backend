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
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto';
import { VerificationStatus } from '../../../common/enums';

export class OnboardingStep1Dto {
  @ApiProperty({ example: 'Shenzhen Precision Electronics Co., Ltd.' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ example: 'OEM/ODM Manufacturer' })
  @IsString()
  @IsNotEmpty()
  businessType: string;

  @ApiPropertyOptional({ example: 2012 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  yearEstablished?: number;

  @ApiPropertyOptional({ example: '100-250 people' })
  @IsOptional()
  @IsString()
  totalEmployees?: string;

  @ApiPropertyOptional({ example: '$5,000,000 USD' })
  @IsOptional()
  @IsString()
  registeredCapital?: string;

  @ApiPropertyOptional({ example: '$10M - $50M USD' })
  @IsOptional()
  @IsString()
  annualRevenue?: string;

  @ApiProperty({ example: 'Building 4, High-Tech Industrial Park, Nanshan' })
  @IsString()
  @IsNotEmpty()
  operationalAddress: string;

  @ApiProperty({ example: 'Shenzhen' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Guangdong' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: 'China' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiPropertyOptional({ example: 'https://www.precision-elec.com' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ example: 'https://cdn.daymoon.com/logos/precision.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://cdn.daymoon.com/banners/factory.jpg' })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiProperty({ example: 'Leading B2B manufacturer specializing in high-speed SMT assembly, IoT devices, and PCB fabrication.' })
  @IsString()
  @IsNotEmpty()
  businessDescription: string;
}

export class SellerDocumentItemDto {
  @ApiProperty({ example: 'BUSINESS_LICENSE', enum: ['BUSINESS_LICENSE', 'TAX_CERTIFICATE', 'EXPORT_LICENSE', 'FACTORY_INSPECTION', 'OTHER'] })
  @IsString()
  @IsNotEmpty()
  documentType: any;

  @ApiProperty({ example: 'National Business Registration License' })
  @IsString()
  @IsNotEmpty()
  documentName: string;

  @ApiPropertyOptional({ example: '91440300MA5EXXXX' })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiProperty({ example: 'https://cdn.daymoon.com/docs/license-123.pdf' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsString()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2034-01-01' })
  @IsOptional()
  @IsString()
  expiryDate?: string;
}

export class OnboardingStep2Dto {
  @ApiProperty({ type: [SellerDocumentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SellerDocumentItemDto)
  documents: SellerDocumentItemDto[];
}

export class OnboardingStep3Dto {
  @ApiPropertyOptional({ example: 12000.5, description: 'Factory workshop area in square meters' })
  @IsOptional()
  @IsNumber()
  factorySizeSqMeters?: number;

  @ApiProperty({ example: 8, description: 'Number of automated production lines' })
  @IsInt()
  @Min(1)
  productionLinesCount: number;

  @ApiPropertyOptional({ example: '$25,000,000 USD' })
  @IsOptional()
  @IsString()
  annualOutputValue?: string;

  @ApiPropertyOptional({ example: 'Yamaha SMT Pick & Place Machines (x6), Reflow Ovens, CNC Milling Centers, Automated Optical Inspection (AOI)' })
  @IsOptional()
  @IsString()
  mainEquipment?: string;

  @ApiPropertyOptional({ example: 25, description: 'Number of dedicated R&D engineers' })
  @IsOptional()
  @IsInt()
  rdStaffCount?: number;

  @ApiPropertyOptional({ example: 18, description: 'Number of dedicated QA/QC inspectors' })
  @IsOptional()
  @IsInt()
  qcStaffCount?: number;

  @ApiPropertyOptional({ example: 12, description: 'Years of OEM/ODM customized manufacturing experience' })
  @IsOptional()
  @IsInt()
  oemExperienceYears?: number;

  @ApiPropertyOptional({ example: 15, description: 'Average mass production lead time in days' })
  @IsOptional()
  @IsInt()
  leadTimeDaysAvg?: number;

  @ApiPropertyOptional({ example: 'No. 88 Industrial Avenue, Baoan District, Shenzhen, China' })
  @IsOptional()
  @IsString()
  factoryAddress?: string;
}

export class OnboardingStep4Dto {
  @ApiProperty({ type: [SellerDocumentItemDto], description: 'ISO 9001, CE, RoHS, FDA certificates' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SellerDocumentItemDto)
  certifications: SellerDocumentItemDto[];
}

export class OnboardingStep5Dto {
  @ApiProperty({ example: 'BANK_WIRE', enum: ['BANK_WIRE', 'SWIFT', 'ACH', 'STRIPE'] })
  @IsString()
  @IsNotEmpty()
  payoutMethod: string;

  @ApiProperty({ example: 'Standard Chartered Bank Hong Kong' })
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty({ example: 'SCBLHKHHXXX' })
  @IsString()
  @IsNotEmpty()
  swiftCode: string;

  @ApiProperty({ example: 'Shenzhen Precision Electronics Co., Ltd.' })
  @IsString()
  @IsNotEmpty()
  accountHolderName: string;

  @ApiProperty({ example: '88899900012345' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  payoutCurrency?: string;
}

export class UpdateSellerProfileDto extends OnboardingStep1Dto {}

export class SellerQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'China' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: VerificationStatus })
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;
}
