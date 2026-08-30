import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateCart(buyerId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { buyerId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isThumbnail: true }, take: 1 },
                tieredPrices: { orderBy: { minQuantity: 'asc' } },
                sellerProfile: { select: { id: true, companyName: true, storeSlug: true } },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { buyerId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { where: { isThumbnail: true }, take: 1 },
                  tieredPrices: { orderBy: { minQuantity: 'asc' } },
                  sellerProfile: { select: { id: true, companyName: true, storeSlug: true } },
                },
              },
            },
          },
        },
      });
    }

    const totalAmount = cart.items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0,
    );

    return {
      ...cart,
      totalAmount: Number(totalAmount.toFixed(2)),
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  async addToCart(buyerId: string, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { tieredPrices: { orderBy: { minQuantity: 'asc' } } },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found or currently unavailable');
    }

    if (dto.quantity < product.moq) {
      throw new BadRequestException(
        `Quantity (${dto.quantity}) does not meet the Minimum Order Quantity (MOQ) of ${product.moq} units`,
      );
    }

    const unitPrice = this.calculateTieredUnitPrice(product.tieredPrices, dto.quantity);

    const cart = await this.getOrCreateCart(buyerId);

    const existingItem = cart.items.find((item) => item.productId === dto.productId);

    if (existingItem) {
      const newQty = existingItem.quantity + dto.quantity;
      const newUnitPrice = this.calculateTieredUnitPrice(product.tieredPrices, newQty);

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQty,
          unitPrice: newUnitPrice,
          customizationNotes: dto.customizationNotes || existingItem.customizationNotes,
        },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
          unitPrice,
          customizationNotes: dto.customizationNotes,
        },
      });
    }

    return this.getOrCreateCart(buyerId);
  }

  async updateItem(buyerId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.prisma.cart.findUnique({ where: { buyerId } });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: {
        product: { include: { tieredPrices: { orderBy: { minQuantity: 'asc' } } } },
      },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (dto.quantity < item.product.moq) {
      throw new BadRequestException(
        `Quantity (${dto.quantity}) must meet the product MOQ of ${item.product.moq} units`,
      );
    }

    const unitPrice = this.calculateTieredUnitPrice(item.product.tieredPrices, dto.quantity);

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity: dto.quantity,
        unitPrice,
        customizationNotes: dto.customizationNotes ?? item.customizationNotes,
      },
    });

    return this.getOrCreateCart(buyerId);
  }

  async removeItem(buyerId: string, itemId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { buyerId } });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    await this.prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });

    return this.getOrCreateCart(buyerId);
  }

  async clearCart(buyerId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { buyerId } });
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { message: 'Cart cleared successfully' };
  }

  private calculateTieredUnitPrice(tieredPrices: any[], quantity: number): number {
    if (!tieredPrices || tieredPrices.length === 0) {
      return 0;
    }

    for (let i = tieredPrices.length - 1; i >= 0; i--) {
      const tier = tieredPrices[i];
      if (quantity >= tier.minQuantity) {
        if (!tier.maxQuantity || quantity <= tier.maxQuantity) {
          return Number(tier.unitPrice);
        }
      }
    }

    return Number(tieredPrices[0].unitPrice);
  }
}
