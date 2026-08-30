import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AdminService } from './admin.service';
import { LedgerQueryDto, UpdateCommissionRateDto, VerifySellerDto } from './dto';

@ApiTags('Super Admin & Financial Ledgers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Super Admin: Platform KPIs (Buyers, Verified Suppliers, GMV, Commissions, Subscriptions)' })
  async getDashboard() {
    return this.adminService.getDashboardAnalytics();
  }

  @Post('sellers/:id/audit')
  @ApiOperation({ summary: 'Super Admin: Audit and Approve/Reject supplier KYC and factory verification documents' })
  async auditSeller(
    @Param('id') sellerProfileId: string,
    @Body() dto: VerifySellerDto,
  ) {
    return this.adminService.auditSeller(sellerProfileId, dto);
  }

  @Get('ledger')
  @ApiOperation({ summary: 'Super Admin: View overall platform financial ledger entries' })
  async getLedger(@Query() query: LedgerQueryDto) {
    return this.adminService.getFinancialLedger(query);
  }

  @Get('commissions')
  @ApiOperation({ summary: 'Super Admin: Get all category & tier commission settings' })
  async getCommissionSettings() {
    return this.adminService.getCommissionSettings();
  }

  @Post('commissions')
  @ApiOperation({ summary: 'Super Admin: Add / update category or tier commission rate' })
  async setCommissionSetting(@Body() dto: UpdateCommissionRateDto) {
    return this.adminService.setCommissionSetting(dto);
  }
}
