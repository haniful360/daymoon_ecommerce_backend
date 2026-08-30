import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload, AuthenticatedUser } from '../../../common/interfaces';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'daymoon-b2b-secret-jwt-key',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { sellerProfile: { select: { id: true } } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account not found or is deactivated');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as any,
      sellerProfileId: user.sellerProfile?.id,
    };
  }
}
