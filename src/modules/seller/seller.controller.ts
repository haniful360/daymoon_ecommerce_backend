import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { RegisterSellerDto, UpdateSellerProfileDto } from './dto';
import { SellerService, type SellerUploadedFiles } from './seller.service';

@ApiTags('Sellers & Factory Profiles')
@Controller('sellers')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  /**
   * POST /api/v1/sellers/register
   * Form-data endpoint for Seller Registration
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'storeLogo', maxCount: 1 },
        { name: 'storeBanner', maxCount: 1 },
        { name: 'verificationDocuments', maxCount: 5 },
      ],
      {
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB per file
        },
        fileFilter: (req, file, callback) => {
          const allowedExtensions = /\.(jpg|jpeg|png|webp|pdf|doc|docx)$/i;
          if (!file.originalname.match(allowedExtensions)) {
            return callback(
              new BadRequestException(
                `File type not allowed for '${file.fieldname}'. Only images (jpg, png, webp) and documents (pdf, doc, docx) are permitted.`,
              ),
              false,
            );
          }
          callback(null, true);
        },
      },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Register a new B2B Seller / Manufacturer (Multipart Form-Data)',
    description:
      'Creates a user with SELLER role and a linked SellerProfile including bank details and optional uploaded store logo, banner, and verification documents.',
  })
  @ApiResponse({
    status: 201,
    description: 'Seller registered successfully and JWT tokens generated',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or missing mandatory bank details',
  })
  @ApiResponse({
    status: 409,
    description: 'Email or business name already exists',
  })
  async registerSeller(
    @Body() dto: RegisterSellerDto,
    @UploadedFiles() files?: SellerUploadedFiles,
  ) {
    return this.sellerService.register(dto, files);
  }

  /**
   * GET /api/v1/sellers/me
   * Get logged-in seller's profile
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({
    summary: 'Get current authenticated seller profile and payout bank details',
  })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.sellerService.getMyProfile(userId);
  }

  /**
   * PATCH /api/v1/sellers/me
   * Update logged-in seller's profile with multipart/form-data
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @ApiBearerAuth()
  @Patch('me')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'storeLogo', maxCount: 1 },
        { name: 'storeBanner', maxCount: 1 },
        { name: 'verificationDocuments', maxCount: 5 },
      ],
      {
        limits: { fileSize: 10 * 1024 * 1024 },
      },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update current seller business profile and media',
  })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSellerProfileDto,
    @UploadedFiles() files?: SellerUploadedFiles,
  ) {
    return this.sellerService.updateProfile(userId, dto, files);
  }

  /**
   * GET /api/v1/sellers
   * Public directory of verified sellers
   */
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Browse verified factory sellers directory with pagination',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async listSellers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.sellerService.listVerifiedSellers(Number(page), Number(limit));
  }

  /**
   * GET /api/v1/sellers/:id
   * Public storefront profile for buyers
   */
  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get public storefront details of a seller for marketplace buyers',
  })
  async getPublicProfile(@Param('id') id: string) {
    return this.sellerService.getPublicProfile(id);
  }
}
