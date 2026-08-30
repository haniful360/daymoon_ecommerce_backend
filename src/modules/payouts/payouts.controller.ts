import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import type { AuthenticatedUser } from '../../common/interfaces';
import { PayoutQueryDto, ProcessPayoutDto, RequestPayoutDto } from './dto';
import { PayoutsService } from './payouts.service';

@ApiTags('Payouts & Supplier Balance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get('balance')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Seller: Check available net earnings balance and pending withdrawals' })
  async getBalance(@CurrentUser('id') userId: string) {
    return this.payoutsService.getSellerBalance(userId);
  }

  @Post('withdraw')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Seller: Request payout withdrawal (Bank Wire / SWIFT / ACH / Stripe)' })
  async requestPayout(
    @CurrentUser('id') userId: string,
    @Body() dto: RequestPayoutDto,
  ) {
    return this.payoutsService.requestPayout(userId, dto);
  }

  @Get()
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Seller/Admin: View payout withdrawal history' })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PayoutQueryDto,
  ) {
    return this.payoutsService.findAll(user.id, user.role, query);
  }

  @Patch(':id/process')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Super Admin: Approve/Complete or Reject a payout withdrawal request' })
  async processPayout(
    @Param('id') payoutId: string,
    @Body() dto: ProcessPayoutDto,
  ) {
    return this.payoutsService.processPayout(payoutId, dto);
  }
}
