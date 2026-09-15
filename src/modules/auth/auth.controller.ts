import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Public } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards';
import type { AuthenticatedUser } from '../../common/interfaces';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterBuyerDto,
  RegisterDto,
  SendOtpDto,
} from './dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('buyer/send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send 6-digit verification OTP to email for Buyer registration',
  })
  @ApiResponse({
    status: 200,
    description:
      'OTP successfully sent to recipient email and stored in Redis (5 min TTL)',
  })
  async sendBuyerOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendBuyerOtp(dto);
  }

  @Public()
  @Post('buyer/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Verify OTP from Redis and complete Buyer registration',
  })
  @ApiResponse({
    status: 201,
    description:
      'Buyer account registered and verified, JWT access tokens issued',
  })
  async registerBuyer(@Body() dto: RegisterBuyerDto) {
    return this.authService.registerBuyer(dto);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new Buyer or Seller account' })
  @ApiResponse({ status: 201, description: 'Account registered successfully' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login with email and password' })
  @ApiResponse({ status: 200, description: 'Logged in successfully' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT access token using refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({
    summary: 'Get current authenticated user profile & supplier details',
  })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user account password' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }
}
