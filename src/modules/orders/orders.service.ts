import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationMetaDto } from '../../common/dto';
import { OrderStatus, UserRole } from '../../common/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, OrderQueryDto, UpdateOrderStatusDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createFromCart(buyerId: string, dto: CreateOrderDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { buyerId },
      include: {
        items: {
          include: {
            product: {
              include: { sellerProfile: true },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Shopping cart is empty. Add products before checkout.');
    }

    const itemsBySeller = new Map<string, typeof cart.items>();
    for (const item of cart.items) {
      const sellerId = item.product.sellerProfileId;
      if (!itemsBySeller.has(sellerId)) {
        itemsBySeller.set(sellerId, []);
      }
      itemsBySeller.get(sellerId)!.push(item);
    }

    const createdOrders: any[] = [];

    for (const [sellerProfileId, items] of itemsBySeller.entries()) {
      const orderNumber = `DM-ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const totalAmount = items.reduce(
        (sum, item) => sum + Number(item.unitPrice) * item.quantity,
        0,
      );

      const commissionRate = 5.0;
      const commissionAmount = Number(((totalAmount * commissionRate) / 100).toFixed(2));
      const sellerNetAmount = Number((totalAmount - commissionAmount).toFixed(2));

      const order = await this.prisma.order.create({
        data: {
          orderNumber,
          buyerId,
          sellerProfileId,
          totalAmount,
          commissionRate,
          commissionAmount,
          sellerNetAmount,
          incoterm: dto.incoterm as any,
          destinationPort: dto.destinationPort,
          shippingAddress: dto.shippingAddress as any,
          notes: dto.notes,
          orderStatus: 'CONFIRMED',
          paymentStatus: 'PAID',
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              productTitle: item.product.title,
              productSku: item.product.sku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: Number(item.unitPrice) * item.quantity,
              customizationDetails: item.customizationNotes
                ? { notes: item.customizationNotes }
                : undefined,
            })),
          },
          statusHistory: {
            create: {
              newStatus: 'CONFIRMED',
              note: 'Trade Assurance Escrow Order initialized & confirmed',
              updatedByUserId: buyerId,
            },
          },
        },
        include: {
          items: true,
          sellerProfile: { select: { companyName: true, storeSlug: true } },
        },
      });

      for (const item of items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: { ordersCount: { increment: item.quantity } },
        });
      }

      await this.prisma.financialLedger.create({
        data: {
          transactionType: 'ORDER_ESCROW_HOLD',
          amount: totalAmount,
          currency: 'USD',
          referenceType: 'ORDER',
          referenceId: order.id,
          balanceAfter: 0,
          note: `Trade Assurance Escrow Hold for Order ${orderNumber}`,
        },
      });

      createdOrders.push(order);
    }

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return createdOrders;
  }

  async findOne(userId: string, role: UserRole, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { include: { images: { take: 1 } } } } },
        buyer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        sellerProfile: { select: { id: true, companyName: true, storeSlug: true, userId: true } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        reviews: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (role === UserRole.BUYER && order.buyerId !== userId) {
      throw new ForbiddenException('You do not have access to view this order');
    }
    if (role === UserRole.SELLER && order.sellerProfile.userId !== userId) {
      throw new ForbiddenException('You do not have access to view this order');
    }

    return order;
  }

  async updateStatus(userId: string, role: UserRole, orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { sellerProfile: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (role === UserRole.SELLER && order.sellerProfile.userId !== userId) {
      throw new ForbiddenException('You can only update status of your own orders');
    }

    const prevStatus = order.orderStatus;

    const [updatedOrder] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { orderStatus: dto.status as any },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          previousStatus: prevStatus,
          newStatus: dto.status as any,
          note: dto.note || `Status updated to ${dto.status}`,
          updatedByUserId: userId,
        },
      }),
    ]);

    if (dto.status === OrderStatus.DELIVERED && prevStatus !== OrderStatus.DELIVERED) {
      await this.prisma.financialLedger.create({
        data: {
          transactionType: 'ORDER_COMMISSION',
          amount: order.commissionAmount,
          currency: 'USD',
          referenceType: 'ORDER',
          referenceId: order.id,
          balanceAfter: 0,
          note: `Commission realized from delivered order ${order.orderNumber}`,
        },
      });
    }

    return updatedOrder;
  }

  async findAll(userId: string, role: UserRole, query: OrderQueryDto) {
    const where: any = {};

    if (role === UserRole.BUYER) {
      where.buyerId = userId;
    } else if (role === UserRole.SELLER) {
      const seller = await this.prisma.sellerProfile.findUnique({ where: { userId } });
      if (!seller) return { items: [], meta: new PaginationMetaDto(0, 1, 20) };
      where.sellerProfileId = seller.id;
    } else if (query.sellerProfileId) {
      where.sellerProfileId = query.sellerProfileId;
    }

    if (query.status) {
      where.orderStatus = query.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: query.skip,
        take: query.take,
        include: {
          items: true,
          sellerProfile: { select: { companyName: true, storeSlug: true } },
          buyer: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: query.sortOrder || 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items,
      meta: new PaginationMetaDto(total, query.page ?? 1, query.limit ?? 20),
    };
  }
}
