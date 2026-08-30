import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import {
  OnboardingStep1Dto,
  OnboardingStep2Dto,
  OnboardingStep3Dto,
  OnboardingStep4Dto,
  OnboardingStep5Dto,
  SellerQueryDto,
  UpdateSellerProfileDto,
} from './dto';
import { SellersService } from './sellers.service';

@ApiTags('Sellers & Factory Sourcing')
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Public: Search & browse manufacturer / factory profiles' })
  async findAll(@Query() query: SellerQueryDto) {
    return this.sellersService.findAll(query);
  }

  @Public()
  @Get('store/:slug')
  @ApiOperation({ summary: 'Public: View factory storefront, equipment & audited certifications' })
  async getProfileBySlug(@Param('slug') slug: string) {
    return this.sellersService.getProfileBySlug(slug);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Get('my-store')
  @ApiOperation({ summary: 'Seller: View own factory profile and onboarding status' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.sellersService.getMyProfile(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Post('onboarding/step-1')
  @ApiOperation({ summary: 'Seller Onboarding Step 1: Company Profile & Business Details' })
  async step1(
    @CurrentUser('id') userId: string,
    @Body() dto: OnboardingStep1Dto,
  ) {
    return this.sellersService.saveOnboardingStep1(userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Post('onboarding/step-2')
  @ApiOperation({ summary: 'Seller Onboarding Step 2: Verification Documents Upload' })
  async step2(
    @CurrentUser('id') userId: string,
    @Body() dto: OnboardingStep2Dto,
  ) {
    return this.sellersService.saveOnboardingStep2(userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Post('onboarding/step-3')
  @ApiOperation({ summary: 'Seller Onboarding Step 3: Factory Capabilities & Machinery' })
  async step3(
    @CurrentUser('id') userId: string,
    @Body() dto: OnboardingStep3Dto,
  ) {
    return this.sellersService.saveOnboardingStep3(userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Post('onboarding/step-4')
  @ApiOperation({ summary: 'Seller Onboarding Step 4: ISO & Quality Certifications' })
  async step4(
    @CurrentUser('id') userId: string,
    @Body() dto: OnboardingStep4Dto,
  ) {
    return this.sellersService.saveOnboardingStep4(userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Post('onboarding/step-5')
  @ApiOperation({ summary: 'Seller Onboarding Step 5: Bank Wire Details & Submit for Verification' })
  async step5(
    @CurrentUser('id') userId: string,
    @Body() dto: OnboardingStep5Dto,
  ) {
    return this.sellersService.saveOnboardingStep5(userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Put('my-store')
  @ApiOperation({ summary: 'Seller: Update store profile' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSellerProfileDto,
  ) {
    return this.sellersService.updateProfile(userId, dto);
  }
}
