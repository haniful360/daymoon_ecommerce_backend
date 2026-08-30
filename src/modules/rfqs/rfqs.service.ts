import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationMetaDto } from '../../common/dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuoteDto, CreateRfqDto, RfqQueryDto } from './dto';

@Injectable()
export class RfqsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(buyerId: string, dto: CreateRfqDto) {
    const rfqNumber = `DM-RFQ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (dto.expiresInDays || 30));

    const { attachments, expiresInDays, ...rfqData } = dto;

    return this.prisma.rfq.create({
      data: {
        ...rfqData,
        rfqNumber,
        buyerId,
        expiryDate,
        targetDeliveryDate: dto.targetDeliveryDate ? new Date(dto.targetDeliveryDate) : null,
        attachments: attachments && attachments.length > 0
          ? {
              create: attachments.map((att) => ({
                fileName: att.fileName,
                fileUrl: att.fileUrl,
                fileType: att.fileType,
                fileSizeBytes: att.fileSizeBytes,
              })),
            }
          : undefined,
      },
      include: {
        attachments: true,
        category: true,
      },
    });
  }

  async findOne(rfqId: string) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id: rfqId },
      include: {
        attachments: true,
        category: true,
        buyer: { select: { id: true, firstName: true, lastName: true } },
        quotes: {
          include: {
            sellerProfile: {
              select: {
                id: true,
                companyName: true,
                storeSlug: true,
                verificationStatus: true,
                currentTier: true,
                country: true,
              },
            },
          },
        },
      },
    });

    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }

    return rfq;
  }

  async submitQuote(userId: string, rfqId: string, dto: CreateQuoteDto) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      include: { subscriptions: { where: { status: 'ACTIVE' }, include: { plan: true } } },
    });

    if (!seller) {
      throw new ForbiddenException('Only registered suppliers can submit quotes');
    }

    const rfq = await this.prisma.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }

    if (rfq.status !== 'OPEN' && rfq.status !== 'UNDER_REVIEW') {
      throw new BadRequestException('This RFQ is no longer open for quotes');
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyQuoteCount = await this.prisma.quote.count({
      where: {
        sellerProfileId: seller.id,
        createdAt: { gte: startOfMonth },
      },
    });

    const activeSub = seller.subscriptions[0];
    const maxQuotes = activeSub?.plan?.maxMonthlyQuotes ?? 20;

    if (monthlyQuoteCount >= maxQuotes) {
      throw new ForbiddenException(
        `Monthly quote limit of ${maxQuotes} reached. Upgrade membership tier to submit unlimited quotes.`,
      );
    }

    const quoteNumber = `DM-QT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (dto.validityDays || 14));

    const totalAmount = Number(dto.unitPrice) * rfq.targetQuantity;

    const [quote] = await this.prisma.$transaction([
      this.prisma.quote.create({
        data: {
          quoteNumber,
          rfqId,
          sellerProfileId: seller.id,
          unitPrice: dto.unitPrice,
          totalAmount,
          moqOffered: dto.moqOffered,
          sampleLeadDays: dto.sampleLeadDays,
          productionLeadDays: dto.productionLeadDays,
          incotermOffered: dto.incotermOffered as any,
          shippingPort: dto.shippingPort,
          paymentTerms: dto.paymentTerms,
          validUntil,
          sellerNotes: dto.sellerNotes,
        },
        include: { sellerProfile: true },
      }),
      this.prisma.rfq.update({
        where: { id: rfqId },
        data: { status: 'QUOTED' },
      }),
    ]);

    return quote;
  }

  async acceptQuote(buyerId: string, quoteId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { rfq: true, sellerProfile: true },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.rfq.buyerId !== buyerId) {
      throw new ForbiddenException('Only the RFQ owner can accept this quote');
    }

    await this.prisma.$transaction([
      this.prisma.quote.update({
        where: { id: quoteId },
        data: { status: 'ACCEPTED' },
      }),
      this.prisma.rfq.update({
        where: { id: quote.rfqId },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    return {
      message: 'Quote accepted successfully. Trade Assurance order can now be generated.',
      quoteId,
      rfqId: quote.rfqId,
    };
  }

  async findAll(query: RfqQueryDto) {
    const where: any = {};
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.rfq.findMany({
        where,
        skip: query.skip,
        take: query.take,
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { quotes: true } },
        },
        orderBy: { createdAt: query.sortOrder || 'desc' },
      }),
      this.prisma.rfq.count({ where }),
    ]);

    return {
      items,
      meta: new PaginationMetaDto(total, query.page ?? 1, query.limit ?? 20),
    };
  }
}
