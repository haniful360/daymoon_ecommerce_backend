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
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CreateQuoteDto, CreateRfqDto, RfqQueryDto } from './dto';
import { RfqsService } from './rfqs.service';

@ApiTags('RFQs (Request for Quotations) & Sourcing')
@Controller('rfqs')
export class RfqsController {
  constructor(private readonly rfqsService: RfqsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Public: Search & browse active sourcing RFQs' })
  async findAll(@Query() query: RfqQueryDto) {
    return this.rfqsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Public: Get RFQ specifications, target requirements & quotes' })
  async findOne(@Param('id') id: string) {
    return this.rfqsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER)
  @Post()
  @ApiOperation({ summary: 'Buyer: Submit a new RFQ sourcing inquiry with Incoterms & technical specs' })
  async create(
    @CurrentUser('id') buyerId: string,
    @Body() dto: CreateRfqDto,
  ) {
    return this.rfqsService.create(buyerId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Post(':id/quote')
  @ApiOperation({ summary: 'Seller: Submit a factory quotation / counter-offer on an active RFQ' })
  async submitQuote(
    @CurrentUser('id') userId: string,
    @Param('id') rfqId: string,
    @Body() dto: CreateQuoteDto,
  ) {
    return this.rfqsService.submitQuote(userId, rfqId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER)
  @Post('quotes/:quoteId/accept')
  @ApiOperation({ summary: 'Buyer: Accept a supplier quote' })
  async acceptQuote(
    @CurrentUser('id') buyerId: string,
    @Param('quoteId') quoteId: string,
  ) {
    return this.rfqsService.acceptQuote(buyerId, quoteId);
  }
}
