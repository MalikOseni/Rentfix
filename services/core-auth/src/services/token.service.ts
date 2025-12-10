import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenResponse } from '../dto/token.response';
import { User } from '../entities/user.entity';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async generateTokens(user: User, tokenVersion = 1): Promise<TokenResponse> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      org_id: user.tenantId,
      token_version: tokenVersion
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'access-secret',
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getExpirySeconds(process.env.JWT_ACCESS_EXPIRES_IN || '15m'),
      tokenType: 'Bearer'
    };
  }

  verifyAccess(token: string) {
    return this.jwtService.verify(token, {
      secret: process.env.JWT_ACCESS_SECRET || 'access-secret'
    });
  }

  verifyRefresh(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret'
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  getExpirySeconds(duration: string): number {
    if (/^\d+$/.test(duration)) {
      return Number(duration);
    }

    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 0;

    const value = Number(match[1]);
    const unit = match[2];
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 0;
    }
  }
}
