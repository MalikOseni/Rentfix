import { ConflictException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { AgentSignupDto } from '../dto/agent-signup.dto';
import { RegisterDto } from '../dto/register.dto';
import { TokenResponse } from '../dto/token.response';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { AuditLog } from '../entities/audit-log.entity';
import { Organization } from '../entities/organization.entity';
import { Otp } from '../entities/otp.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { Role } from '../entities/role.entity';
import { User, UserRole } from '../entities/user.entity';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const OTP_EXPIRY_MS = 10 * 60 * 1000;

export interface AgentSignupResponse {
  temporaryToken: string;
  otpExpiresAt: Date;
  otpDelivery: { email: string; sms?: string };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService
  ) {}

  async register(payload: RegisterDto): Promise<TokenResponse> {
    const normalizedEmail = this.normalizeEmail(payload.email);
    const existing = await this.userRepository.findOne({ where: { emailNormalized: normalizedEmail, deletedAt: IsNull() } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.passwordService.hash(payload.password);
    const user = this.userRepository.create({
      email: payload.email,
      emailNormalized: normalizedEmail,
      passwordHash,
      role: payload.role || UserRole.tenant,
      tenantId: payload.tenantId ?? null,
      firstName: payload.firstName ?? null,
      lastName: payload.lastName ?? null,
      emailVerified: false,
      phone: null
    });

    const saved = await this.userRepository.save(user);
    await this.logAudit('SIGNUP_INITIATED', saved, null);
    return this.issueAndPersistTokens(saved);
  }

  async agentSignup(payload: AgentSignupDto, ip?: string, userAgent?: string): Promise<AgentSignupResponse> {
    const normalizedEmail = this.normalizeEmail(payload.email);
    const existing = await this.userRepository.findOne({ where: { emailNormalized: normalizedEmail, deletedAt: IsNull() } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.passwordService.hash(payload.password);
    const user = this.userRepository.create({
      email: payload.email,
      emailNormalized: normalizedEmail,
      passwordHash,
      role: UserRole.agent,
      tenantId: null,
      phone: payload.phone,
      emailVerified: false,
      firstName: null,
      lastName: null
    });

    const savedUser = await this.userRepository.save(user);
    const organization = this.organizationRepository.create({
      owner: savedUser,
      name: payload.companyName,
      companyRegistrationNumber: payload.companyRegistrationNumber ?? null,
      plan: 'pro',
      status: 'active',
      propertiesQuota: 5,
      stripeCustomerId: null
    });
    const savedOrg = await this.organizationRepository.save(organization);

    // OWNER role with full permissions
    const ownerRole = this.refreshTokenRepository.manager.create(Role, {
      name: 'OWNER',
      user: savedUser,
      organization: savedOrg,
      permissionGrants: ['*']
    });
    await this.refreshTokenRepository.manager.save(ownerRole);

    const { otpCode, temporaryToken, expiresAt } = await this.issueOtp(savedUser);
    await this.logAudit('SIGNUP_INITIATED', savedUser, savedOrg, ip, userAgent);

    // In production this would be sent via email/SMS. We return tokens for testing purposes.
    return { temporaryToken, otpExpiresAt: expiresAt, otpDelivery: { email: payload.email, sms: payload.phone } };
  }

  async login(email: string, password: string, ip?: string): Promise<TokenResponse> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userRepository.findOne({ where: { emailNormalized: normalizedEmail, deletedAt: IsNull() } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.enforceRateLimits(user);

    const valid = await this.passwordService.verifyHash(password, user.passwordHash);
    if (!valid) {
      user.failedLoginAttempts += 1;
      user.failedLoginAt = new Date();
      await this.userRepository.save(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('Account suspended');
    }

    user.failedLoginAttempts = 0;
    user.failedLoginAt = null;
    user.lastLogin = new Date();
    user.lastLoginIp = ip ?? null;
    await this.userRepository.save(user);

    const tokens = await this.issueAndPersistTokens(user);
    await this.logAudit('LOGIN_SUCCESS', user, null, ip);
    return tokens;
  }

  async refresh(refreshToken: string): Promise<TokenResponse> {
    const payload = this.tokenService.verifyRefresh(refreshToken);
    const user = await this.userRepository.findOne({ where: { id: payload.sub, deletedAt: IsNull() } });
    if (!user) {
      throw new UnauthorizedException('Unknown account');
    }

    const tokens = await this.refreshTokenRepository.find({
      where: { user: { id: user.id }, revokedAt: IsNull() },
      relations: ['user']
    });

    const validToken = await this.findMatchingRefreshToken(tokens, refreshToken);
    if (!validToken) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (payload.token_version < validToken.tokenVersion) {
      await this.revokeAllUserSessions(user.id);
      throw new UnauthorizedException('Possible token theft');
    }

    return this.issueAndPersistTokens(user);
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<TokenResponse> {
    const candidates = await this.otpRepository.find({ where: { usedAt: IsNull() }, relations: ['user'] });
    const now = new Date();
    const matching = await this.findMatchingOtp(candidates, dto.temporaryToken, dto.otp);

    if (!matching) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    if (matching.expiresAt.getTime() < now.getTime()) {
      throw new UnauthorizedException('OTP expired');
    }

    matching.useCount += 1;
    matching.usedAt = now;
    matching.user.emailVerified = true;
    await this.userRepository.save(matching.user);
    await this.otpRepository.save(matching);
    await this.logAudit('EMAIL_VERIFIED', matching.user, null);

    return this.issueAndPersistTokens(matching.user);
  }

  private async issueAndPersistTokens(user: User): Promise<TokenResponse> {
    const maxVersionResult = await this.refreshTokenRepository
      .createQueryBuilder('token')
      .where('token.userId = :userId', { userId: user.id })
      .select('MAX(token.tokenVersion)', 'max')
      .getRawOne<{ max: string | null }>();

    const nextVersion = (maxVersionResult?.max ? Number(maxVersionResult.max) : 0) + 1;
    const tokens = await this.tokenService.generateTokens(user, nextVersion);
    const hashedRefresh = await this.passwordService.hash(tokens.refreshToken);

    const refresh = this.refreshTokenRepository.create({
      user,
      tokenHash: hashedRefresh,
      tokenVersion: nextVersion,
      deviceFingerprint: null,
      expiresAt: new Date(
        Date.now() + this.tokenService.getExpirySeconds(process.env.JWT_REFRESH_EXPIRES_IN || '30d') * 1000
      ),
      revokedAt: null
    });
    await this.refreshTokenRepository.save(refresh);
    return tokens;
  }

  private enforceRateLimits(user: User) {
    if (!user.failedLoginAt || user.failedLoginAttempts < LOGIN_ATTEMPT_LIMIT) return;

    const sinceLastAttempt = Date.now() - user.failedLoginAt.getTime();
    if (sinceLastAttempt <= LOGIN_ATTEMPT_WINDOW_MS && user.failedLoginAttempts >= LOGIN_ATTEMPT_LIMIT) {
      throw new HttpException('Too many attempts, locked for 15 minutes', HttpStatus.TOO_MANY_REQUESTS);
    }

    if (sinceLastAttempt > LOGIN_ATTEMPT_WINDOW_MS) {
      user.failedLoginAttempts = 0;
      user.failedLoginAt = null;
    }
  }

  private async revokeAllUserSessions(userId: string) {
    await this.refreshTokenRepository.update({ user: { id: userId } }, { revokedAt: new Date() });
  }

  private async issueOtp(user: User): Promise<{ otpCode: string; temporaryToken: string; expiresAt: Date }> {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const temporaryToken = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    const otpHash = await this.passwordService.hash(otpCode);
    const tempTokenHash = await this.passwordService.hash(temporaryToken);
    const otpEntity = this.otpRepository.create({
      user,
      otpHash,
      temporaryTokenHash: tempTokenHash,
      expiresAt,
      usedAt: null,
      useCount: 0
    });

    await this.otpRepository.save(otpEntity);
    return { otpCode, temporaryToken, expiresAt };
  }

  private async findMatchingOtp(records: Otp[], temporaryToken: string, otp: string): Promise<Otp | null> {
    for (const record of records) {
      const tokenMatches = await this.passwordService.verifyHash(temporaryToken, record.temporaryTokenHash);
      if (!tokenMatches) continue;

      const otpMatches = await this.passwordService.verifyHash(otp, record.otpHash);
      if (!otpMatches) continue;

      return record;
    }
    return null;
  }

  private async findMatchingRefreshToken(tokens: RefreshToken[], presented: string): Promise<RefreshToken | null> {
    for (const token of tokens) {
      const matches = await this.passwordService.verifyHash(presented, token.tokenHash);
      if (matches && token.expiresAt > new Date() && !token.revokedAt) {
        return token;
      }
    }
    return null;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async logAudit(action: string, user: User | null, organization: Organization | null, ip?: string, userAgent?: string) {
    const entry = this.auditLogRepository.create({
      action,
      user,
      organization,
      ip: ip ?? null,
      userAgent: userAgent ?? null
    });
    await this.auditLogRepository.save(entry);
  }
}
