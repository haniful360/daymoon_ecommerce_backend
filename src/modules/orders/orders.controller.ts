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
import { CreateOrderDto, OrderQueryDto, UpdateOrderStatusDto } from './dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders & Trade Assurance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Buyer: Place wholesale Trade Assurance orders from cart' })
  async checkout(
    @CurrentUser('id') buyerId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createFromCart(buyerId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Buyer/Seller/Admin: List orders with milestone filtering' })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OrderQueryDto,
  ) {
    return this.ordersService.findAll(user.id, user.role, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details, items, specifications, and milestone history' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') orderId: string,
  ) {
    return this.ordersService.findOne(user.id, user.role, orderId);
  }

  @Patch(':id/status')
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Seller/Admin: Update order production/shipping milestone status' })
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(user.id, user.role, orderId, dto);
  }
}
