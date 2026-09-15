import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { BankDetailsDto } from './bank-details.dto';

export class RegisterSellerDto {
  // ==========================================
  // 1. USER ACCOUNT CREDENTIALS
  // ==========================================
  @ApiProperty({
    example: 'Haniful Islam',
    description: 'Seller primary contact / representative full name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Representative name is required' })
  name!: string;

  @ApiProperty({
    example: 'seller@daymoon.com',
    description: 'Login email address for the seller account',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email!: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    minLength: 8,
    description: 'Account password (minimum 8 characters)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @ApiPropertyOptional({
    example: '+8801700000000',
    description: 'Contact phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  // ==========================================
  // 2. SELLER BUSINESS PROFILE
  // ==========================================
  @ApiProperty({
    example: 'Daymoon Apex Manufacturing Ltd',
    description: 'Official registered business or company name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Business name is required' })
  businessName!: string;

  @ApiProperty({
    example: 'Manufacturer & Exporter',
    description:
      'Type of business (Manufacturer, Wholesaler, Exporter, Supplier, etc.)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Business type is required' })
  businessType!: string;

  @ApiPropertyOptional({
    example:
      'Specialized in premium textiles, garments, and eco-friendly consumer goods.',
    description: 'Detailed company and manufacturing description',
  })
  @IsOptional()
  @IsString()
  businessDescription?: string;

  @ApiProperty({
    example: 'Bangladesh',
    description: 'Country of incorporation or operation',
  })
  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  country!: string;

  @ApiPropertyOptional({
    example: 'TAX-BD-987654321',
    description:
      'Government Business Identification / Tax ID / BIN / VAT number',
  })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Total operational years in business',
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== null && value !== '' ? Number(value) : 1,
  )
  @IsInt()
  @Min(0)
  yearsInBusiness?: number;

  @ApiPropertyOptional({
    example: '25,000 sq. meters',
    description: 'Manufacturing facility or warehouse size',
  })
  @IsOptional()
  @IsString()
  factorySize?: string;

  @ApiPropertyOptional({
    example: '20-50 People',
    description: 'R&D and engineering department staff count',
  })
  @IsOptional()
  @IsString()
  rdStaffCount?: string;

  @ApiPropertyOptional({
    example: '7 Days Return for Defective Goods',
    description: 'Default return and warranty policy',
    default: '7 Days',
  })
  @IsOptional()
  @IsString()
  returnPolicy?: string;

  @ApiPropertyOptional({
    example: ['NATIONAL', 'INTERNATIONAL'],
    description:
      'Supported shipping regions (Array or comma-separated string in form-data)',
    default: ['NATIONAL'],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return value
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    return value;
  })
  shippingRegions?: string[];

  @ApiPropertyOptional({
    example: ['FOB', 'EXW', 'CIF'],
    description: 'Supported international trade terms (Incoterms)',
    default: ['FOB', 'EXW'],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return value
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    return value;
  })
  tradeTerms?: string[];

  @ApiPropertyOptional({
    example: {
      website: 'https://daymoon.com',
      linkedin: 'https://linkedin.com/company/daymoon',
    },
    description:
      'Social links and corporate website (JSON string or object in form-data)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }
    return value;
  })
  socialLinks?: Record<string, any>;

  // ==========================================
  // 3. MANDATORY PAYOUT BANK DETAILS
  // ==========================================
  @ApiProperty({
    type: BankDetailsDto,
    description:
      'Bank details for payouts (can be sent as a JSON string in form-data: {"bankName":"...","accountHolderName":"...","accountNumber":"...","swiftCode":"..."})',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @ValidateNested()
  @Type(() => BankDetailsDto)
  @IsNotEmpty({ message: 'Bank details are mandatory for seller registration' })
  bankDetails!: BankDetailsDto;

  // ==========================================
  // 4. SWAGGER FILE UPLOAD PROPS
  // ==========================================
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Store logo image (JPG, PNG, WEBP)',
  })
  storeLogo?: any;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Store banner cover image (JPG, PNG, WEBP)',
  })
  storeBanner?: any;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description:
      'Business license, tax certificate, or factory audit documents (PDF, JPG, PNG)',
  })
  verificationDocuments?: any;
}
