import {
  BadRequestException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterDto } from '../dto/register.dto';
import { TokenResponse } from '../dto/token.response';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User, UserRole } from '../entities/user.entity';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService
  ) {}

  async register(payload: RegisterDto): Promise<TokenResponse> {
    const existing = await this.userRepository.findOne({ where: { email: payload.email } });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await this.passwordService.hash(payload.password);
    const user = this.userRepository.create({
      email: payload.email,
      passwordHash,
      role: payload.role || UserRole.tenant,
      tenantId: payload.tenantId ?? null,
      firstName: payload.firstName ?? null,
      lastName: payload.lastName ?? null,
      emailVerified: false
    });

    const saved = await this.userRepository.save(user);
    return this.issueAndPersistTokens(saved);
  }

  async login(email: string, password: string): Promise<TokenResponse> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.passwordService.verifyHash(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueAndPersistTokens(user);
  }

  async refresh(refreshToken: string): Promise<TokenResponse> {
    const payload = this.tokenService.verifyRefresh(refreshToken);
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('Unknown account');
    }

    const tokens = await this.refreshTokenRepository.find({
      where: { user: { id: user.id }, revokedAt: null },
      relations: ['user']
    });

    const validToken = tokens.find((token) => token.expiresAt > new Date());
    if (!validToken) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const matches = await this.passwordService.verifyHash(refreshToken, validToken.tokenHash);
    if (!matches) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    return this.issueAndPersistTokens(user);
  }

  private async issueAndPersistTokens(user: User): Promise<TokenResponse> {
    const tokens = await this.tokenService.generateTokens(user);
    const hashedRefresh = await this.passwordService.hash(tokens.refreshToken);

    const refresh = this.refreshTokenRepository.create({
      user,
      tokenHash: hashedRefresh,
      expiresAt: new Date(
        Date.now() + this.tokenService.getExpirySeconds(process.env.JWT_REFRESH_EXPIRES_IN || '30d') * 1000
      ),
      revokedAt: null
    });
    await this.refreshTokenRepository.save(refresh);
    return tokens;
  }
}
