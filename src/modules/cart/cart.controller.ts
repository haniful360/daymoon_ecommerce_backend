import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto';

@ApiTags('Cart & Bulk Wholesale Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Buyer: Get current bulk shopping cart with wholesale tiered totals' })
  async getCart(@CurrentUser('id') buyerId: string) {
    return this.cartService.getOrCreateCart(buyerId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Buyer: Add product to bulk cart with MOQ validation & tier pricing' })
  async addToCart(
    @CurrentUser('id') buyerId: string,
    @Body() dto: AddToCartDto,
  ) {
    return this.cartService.addToCart(buyerId, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Buyer: Update cart item quantity or OEM customization notes' })
  async updateItem(
    @CurrentUser('id') buyerId: string,
    @Param('id') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(buyerId, itemId, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Buyer: Remove item from cart' })
  async removeItem(
    @CurrentUser('id') buyerId: string,
    @Param('id') itemId: string,
  ) {
    return this.cartService.removeItem(buyerId, itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Buyer: Clear entire cart' })
  async clearCart(@CurrentUser('id') buyerId: string) {
    return this.cartService.clearCart(buyerId);
  }
}
