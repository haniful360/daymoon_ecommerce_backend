import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CreateSubscriptionDto, SubscriptionQueryDto } from './dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions & Membership Tiers')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Public: Get all supplier membership plans (Basic $119.99, Standard $299.99, Premium $599.99)' })
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Get('my-subscription')
  @ApiOperation({ summary: 'Seller: Get current active tier, limits, and expiration date' })
  async getMySubscription(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.getMySubscription(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Post('subscribe')
  @ApiOperation({ summary: 'Seller: Subscribe to a membership tier' })
  async subscribe(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.subscribe(userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Post('cancel')
  @ApiOperation({ summary: 'Seller: Cancel auto-renewal of membership subscription' })
  async cancel(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.cancelSubscription(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Get('all')
  @ApiOperation({ summary: 'Super Admin: View all platform supplier subscriptions' })
  async findAll(@Query() query: SubscriptionQueryDto) {
    return this.subscriptionsService.findAll(query);
  }
}
