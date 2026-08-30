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
import { CreateReviewDto, ReplyReviewDto, ReviewQueryDto } from './dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews & Ratings')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Public: List product / supplier reviews' })
  async findAll(@Query() query: ReviewQueryDto) {
    return this.reviewsService.findAll(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER)
  @Post()
  @ApiOperation({ summary: 'Buyer: Review a completed order (Product Quality, Supplier Reliability, Delivery Punctuality)' })
  async create(
    @CurrentUser('id') buyerId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(buyerId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Post(':id/reply')
  @ApiOperation({ summary: 'Seller: Official factory reply to a customer review' })
  async reply(
    @CurrentUser('id') userId: string,
    @Param('id') reviewId: string,
    @Body() dto: ReplyReviewDto,
  ) {
    return this.reviewsService.reply(userId, reviewId, dto);
  }
}
