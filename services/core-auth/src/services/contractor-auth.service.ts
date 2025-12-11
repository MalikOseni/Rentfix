import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import crypto from 'crypto';
import { DataSource, IsNull, Repository } from 'typeorm';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { User, UserRole } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Contractor, ContractorStatus, BackgroundCheckStatus } from '../entities/contractor.entity';
import { Role } from '../entities/role.entity';
import { Otp } from '../entities/otp.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { TokenResponse } from '../dto/token.response';
import { CONTRACTOR_ROLES, ROLE_PERMISSIONS } from '../constants/permissions';

const OTP_EXPIRY_MS = 10 * 60 * 1000;

export interface ContractorSignupDto {
  email: string;
  password: string;
  businessName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  specialties: string[];
  hourlyRate: number;
  insuranceCertUrl?: string;
  insuranceExpiry?: Date;
  bankAccount: string;
  serviceArea?: {
    postcodes?: string[];
    radius_km?: number;
    center?: { lat: number; lng: number };
  };
}

export interface ContractorSignupResponse {
  temporaryToken: string;
  otpExpiresAt: Date;
  otpDelivery: { email: string; sms?: string };
  contractorId: string;
  status: ContractorStatus;
}

export interface ContractorLoginResponse extends TokenResponse {
  contractor: {
    id: string;
    businessName: string;
    status: ContractorStatus;
    backgroundCheckStatus: BackgroundCheckStatus;
    verified: boolean;
  };
}

@Injectable()
export class ContractorAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Contractor)
    private readonly contractorRepository: Repository<Contractor>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService
  ) {}

  /**
   * Self-service contractor registration - NO INVITE REQUIRED
   * Creates user account, contractor profile, and initiates verification flow
   */
  async signup(dto: ContractorSignupDto, ip?: string, userAgent?: string): Promise<ContractorSignupResponse> {
    // Validate email uniqueness
    const normalizedEmail = this.normalizeEmail(dto.email);
    const existing = await this.userRepository.findOne({
      where: { emailNormalized: normalizedEmail, deletedAt: IsNull() }
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Validate phone if provided
    let normalizedPhone: string | null = null;
    if (dto.phone) {
      if (!isValidPhoneNumber(dto.phone, 'GB')) {
        throw new BadRequestException('Invalid phone number format');
      }
      normalizedPhone = parsePhoneNumber(dto.phone, 'GB').format('E.164');
    }

    // Validate business name
    if (!dto.businessName || dto.businessName.trim().length < 2) {
      throw new BadRequestException('Business name must be at least 2 characters');
    }

    // Validate specialties
    if (!dto.specialties || dto.specialties.length === 0) {
      throw new BadRequestException('At least one specialty is required');
    }

    // Validate hourly rate
    if (dto.hourlyRate < 1) {
      throw new BadRequestException('Hourly rate must be at least 1');
    }

    // Validate bank account (basic check)
    if (!dto.bankAccount || dto.bankAccount.length < 6) {
      throw new BadRequestException('Valid bank account details required');
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const bankAccountHash = await this.passwordService.hash(dto.bankAccount);
    const bankAccountLastFour = dto.bankAccount.slice(-4);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedUser: User;
    let savedContractor: Contractor;
    let savedOrg: Organization;

    try {
      // Create user account
      const user = queryRunner.manager.create(User, {
        email: dto.email,
        emailNormalized: normalizedEmail,
        passwordHash,
        role: UserRole.contractor,
        tenantId: null,
        phone: normalizedPhone,
        firstName: dto.firstName || dto.businessName,
        lastName: dto.lastName || null,
        emailVerified: false,
        phoneVerified: false
      });
      savedUser = await queryRunner.manager.save(user);

      // Create contractor organization (for multi-tenant isolation)
      const organization = queryRunner.manager.create(Organization, {
        owner: savedUser,
        name: dto.businessName,
        companyRegistrationNumber: null,
        plan: 'contractor',
        status: 'pending',
        propertiesQuota: 0,
        stripeCustomerId: null
      });
      savedOrg = await queryRunner.manager.save(organization);

      // Update user with org tenantId
      savedUser.tenantId = savedOrg.id;
      await queryRunner.manager.save(savedUser);

      // Create contractor profile
      const contractor = queryRunner.manager.create(Contractor, {
        user: savedUser,
        businessName: dto.businessName.trim(),
        specialties: dto.specialties.map((s) => s.trim().toLowerCase()),
        hourlyRate: dto.hourlyRate,
        insuranceCertUrl: dto.insuranceCertUrl || null,
        insuranceExpiry: dto.insuranceExpiry || null,
        bankAccountHash,
        bankAccountLastFour,
        status: ContractorStatus.PENDING,
        backgroundCheckStatus: BackgroundCheckStatus.NOT_STARTED,
        serviceArea: dto.serviceArea || null,
        averageRating: 0,
        totalJobsCompleted: 0,
        metadata: null
      });
      savedContractor = await queryRunner.manager.save(contractor);

      // Create contractor role with permissions
      const role = queryRunner.manager.create(Role, {
        name: CONTRACTOR_ROLES.CONTRACTOR,
        user: savedUser,
        organization: savedOrg,
        permissionGrants: ROLE_PERMISSIONS.CONTRACTOR
      });
      await queryRunner.manager.save(role);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    // Issue OTP for email verification
    const { temporaryToken, expiresAt } = await this.issueOtp(savedUser);

    // Log audit event
    await this.logAudit('CONTRACTOR_SIGNUP_INITIATED', savedUser, savedOrg, ip, userAgent, {
      businessName: dto.businessName,
      specialties: dto.specialties.join(',')
    });

    return {
      temporaryToken,
      otpExpiresAt: expiresAt,
      otpDelivery: { email: dto.email, sms: normalizedPhone || undefined },
      contractorId: savedContractor.id,
      status: ContractorStatus.PENDING
    };
  }

  /**
   * Verify contractor email and initiate background check
   */
  async verifyEmailAndInitiateBackgroundCheck(
    temporaryToken: string,
    otp: string,
    ip?: string
  ): Promise<ContractorLoginResponse> {
    const otpRecords = await this.otpRepository.find({
      where: { usedAt: IsNull(), deletedAt: IsNull() },
      relations: ['user']
    });

    const matching = await this.findMatchingOtp(otpRecords, temporaryToken, otp);
    if (!matching) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const now = new Date();
    if (matching.expiresAt.getTime() < now.getTime()) {
      throw new UnauthorizedException('OTP expired');
    }

    if (matching.user.deletedAt) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Mark OTP as used
    matching.useCount += 1;
    matching.usedAt = now;
    matching.user.emailVerified = true;
    await this.userRepository.save(matching.user);
    await this.otpRepository.save(matching);

    // Get contractor profile
    const contractor = await this.contractorRepository.findOne({
      where: { user: { id: matching.user.id }, deletedAt: IsNull() }
    });

    if (!contractor) {
      throw new NotFoundException('Contractor profile not found');
    }

    // Initiate background check
    contractor.status = ContractorStatus.BACKGROUND_CHECK_REQUESTED;
    contractor.backgroundCheckStatus = BackgroundCheckStatus.REQUESTED;
    contractor.backgroundCheckId = `BGC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    contractor.backgroundCheckAt = now;
    await this.contractorRepository.save(contractor);

    // Update organization status
    const organization = await this.organizationRepository.findOne({
      where: { owner: { id: matching.user.id }, deletedAt: IsNull() }
    });
    if (organization) {
      organization.status = 'pending_verification';
      await this.organizationRepository.save(organization);
    }

    await this.logAudit('CONTRACTOR_EMAIL_VERIFIED', matching.user, organization, ip, undefined, {
      backgroundCheckId: contractor.backgroundCheckId
    });

    // Issue tokens
    const tokens = await this.issueAndPersistTokens(matching.user);

    return {
      ...tokens,
      contractor: {
        id: contractor.id,
        businessName: contractor.businessName,
        status: contractor.status,
        backgroundCheckStatus: contractor.backgroundCheckStatus,
        verified: false
      }
    };
  }

  /**
   * Contractor login
   */
  async login(email: string, password: string, ip?: string): Promise<ContractorLoginResponse> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userRepository.findOne({
      where: { emailNormalized: normalizedEmail, role: UserRole.contractor, deletedAt: IsNull() }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check rate limiting
    this.enforceRateLimits(user);

    const valid = await this.passwordService.verifyHash(password, user.passwordHash);
    if (!valid) {
      user.failedLoginAttempts += 1;
      user.failedLoginAt = new Date();
      await this.userRepository.save(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get contractor profile
    const contractor = await this.contractorRepository.findOne({
      where: { user: { id: user.id }, deletedAt: IsNull() }
    });

    if (!contractor) {
      throw new NotFoundException('Contractor profile not found');
    }

    // Check contractor status
    if (contractor.status === ContractorStatus.SUSPENDED) {
      throw new UnauthorizedException('Account is suspended');
    }

    if (contractor.status === ContractorStatus.REJECTED) {
      throw new UnauthorizedException('Account registration was rejected');
    }

    // Reset login attempts
    user.failedLoginAttempts = 0;
    user.failedLoginAt = null;
    user.lastLogin = new Date();
    user.lastLoginIp = ip || null;
    await this.userRepository.save(user);

    const tokens = await this.issueAndPersistTokens(user);

    await this.logAudit('CONTRACTOR_LOGIN', user, null, ip);

    return {
      ...tokens,
      contractor: {
        id: contractor.id,
        businessName: contractor.businessName,
        status: contractor.status,
        backgroundCheckStatus: contractor.backgroundCheckStatus,
        verified: contractor.status === ContractorStatus.VERIFIED
      }
    };
  }

  /**
   * Update contractor profile
   */
  async updateProfile(
    userId: string,
    updates: Partial<{
      businessName: string;
      specialties: string[];
      hourlyRate: number;
      insuranceCertUrl: string;
      insuranceExpiry: Date;
      serviceArea: { postcodes?: string[]; radius_km?: number; center?: { lat: number; lng: number } };
      phone: string;
    }>
  ): Promise<Contractor> {
    const contractor = await this.contractorRepository.findOne({
      where: { user: { id: userId }, deletedAt: IsNull() },
      relations: ['user']
    });

    if (!contractor) {
      throw new NotFoundException('Contractor profile not found');
    }

    if (updates.businessName) {
      contractor.businessName = updates.businessName.trim();
    }

    if (updates.specialties) {
      contractor.specialties = updates.specialties.map((s) => s.trim().toLowerCase());
    }

    if (updates.hourlyRate !== undefined) {
      if (updates.hourlyRate < 1) {
        throw new BadRequestException('Hourly rate must be at least 1');
      }
      contractor.hourlyRate = updates.hourlyRate;
    }

    if (updates.insuranceCertUrl !== undefined) {
      contractor.insuranceCertUrl = updates.insuranceCertUrl;
    }

    if (updates.insuranceExpiry !== undefined) {
      contractor.insuranceExpiry = updates.insuranceExpiry;
    }

    if (updates.serviceArea !== undefined) {
      contractor.serviceArea = updates.serviceArea;
    }

    if (updates.phone) {
      if (!isValidPhoneNumber(updates.phone, 'GB')) {
        throw new BadRequestException('Invalid phone number format');
      }
      const normalizedPhone = parsePhoneNumber(updates.phone, 'GB').format('E.164');
      contractor.user.phone = normalizedPhone;
      await this.userRepository.save(contractor.user);
    }

    await this.logAudit('CONTRACTOR_PROFILE_UPDATED', contractor.user, null, undefined, undefined, {
      fields: Object.keys(updates).join(',')
    });

    return this.contractorRepository.save(contractor);
  }

  /**
   * Get contractor profile by user ID
   */
  async getProfile(userId: string): Promise<Contractor | null> {
    return this.contractorRepository.findOne({
      where: { user: { id: userId }, deletedAt: IsNull() },
      relations: ['user']
    });
  }

  /**
   * Update background check status (called by admin/webhook)
   */
  async updateBackgroundCheckStatus(
    contractorId: string,
    status: BackgroundCheckStatus,
    adminUserId?: string
  ): Promise<Contractor> {
    const contractor = await this.contractorRepository.findOne({
      where: { id: contractorId, deletedAt: IsNull() },
      relations: ['user']
    });

    if (!contractor) {
      throw new NotFoundException('Contractor not found');
    }

    contractor.backgroundCheckStatus = status;

    if (status === BackgroundCheckStatus.PASSED) {
      contractor.status = ContractorStatus.VERIFIED;
      contractor.verifiedAt = new Date();

      // Activate organization
      const organization = await this.organizationRepository.findOne({
        where: { owner: { id: contractor.user.id }, deletedAt: IsNull() }
      });
      if (organization) {
        organization.status = 'active';
        await this.organizationRepository.save(organization);
      }
    } else if (status === BackgroundCheckStatus.FAILED) {
      contractor.status = ContractorStatus.BACKGROUND_CHECK_FAILED;
    }

    await this.logAudit(
      'CONTRACTOR_BACKGROUND_CHECK_UPDATED',
      contractor.user,
      null,
      undefined,
      undefined,
      { status, adminUserId }
    );

    return this.contractorRepository.save(contractor);
  }

  /**
   * Resend OTP for email verification
   */
  async resendOtp(email: string): Promise<{ temporaryToken: string; expiresAt: Date }> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userRepository.findOne({
      where: { emailNormalized: normalizedEmail, role: UserRole.contractor, deletedAt: IsNull() }
    });

    if (!user) {
      throw new NotFoundException('Contractor not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Invalidate existing OTPs
    await this.otpRepository.update(
      { user: { id: user.id }, usedAt: IsNull(), deletedAt: IsNull() },
      { deletedAt: new Date() }
    );

    const { temporaryToken, expiresAt } = await this.issueOtp(user);

    await this.logAudit('CONTRACTOR_OTP_RESENT', user, null);

    return { temporaryToken, expiresAt };
  }

  /**
   * Delete contractor account (GDPR compliance)
   */
  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId, role: UserRole.contractor, deletedAt: IsNull() }
    });

    if (!user) {
      throw new NotFoundException('Contractor not found');
    }

    const valid = await this.passwordService.verifyHash(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Soft delete contractor profile
    await this.contractorRepository.update(
      { user: { id: userId }, deletedAt: IsNull() },
      { deletedAt: new Date() }
    );

    // Soft delete organization
    await this.organizationRepository.update(
      { owner: { id: userId }, deletedAt: IsNull() },
      { deletedAt: new Date() }
    );

    // Revoke all sessions
    await this.refreshTokenRepository.update(
      { user: { id: userId }, deletedAt: IsNull() },
      { revokedAt: new Date() }
    );

    // Soft delete user
    user.deletedAt = new Date();
    await this.userRepository.save(user);

    await this.logAudit('CONTRACTOR_ACCOUNT_DELETED', user, null);
  }

  // Private helper methods

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

    // In production, send OTP via email/SMS
    // await this.emailService.sendOtp(user.email, otpCode);

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

  private async issueAndPersistTokens(user: User): Promise<TokenResponse> {
    const maxVersionResult = await this.refreshTokenRepository
      .createQueryBuilder('token')
      .where('token.userId = :userId', { userId: user.id })
      .andWhere('token.deleted_at IS NULL')
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
        Date.now() + this.tokenService.getExpirySeconds(process.env.JWT_REFRESH_EXPIRES_IN || '7d') * 1000
      ),
      revokedAt: null
    });

    await this.refreshTokenRepository.save(refresh);
    return tokens;
  }

  private enforceRateLimits(user: User): void {
    const LOGIN_ATTEMPT_LIMIT = 5;
    const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

    if (!user.failedLoginAt || user.failedLoginAttempts < LOGIN_ATTEMPT_LIMIT) return;

    const sinceLastAttempt = Date.now() - user.failedLoginAt.getTime();
    if (sinceLastAttempt <= LOGIN_ATTEMPT_WINDOW_MS && user.failedLoginAttempts >= LOGIN_ATTEMPT_LIMIT) {
      throw new UnauthorizedException('Too many attempts, account locked for 15 minutes');
    }

    if (sinceLastAttempt > LOGIN_ATTEMPT_WINDOW_MS) {
      user.failedLoginAttempts = 0;
      user.failedLoginAt = null;
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async logAudit(
    action: string,
    user: User | null,
    organization: Organization | null,
    ip?: string,
    userAgent?: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    const sanitizedDetails = details
      ? Object.entries(details).reduce<Record<string, unknown>>((acc, [key, value]) => {
          if (typeof value === 'string' && value.includes('@')) {
            acc[key] = this.maskEmail(value);
          } else if (typeof value === 'string' && value.replace(/\D/g, '').length >= 4) {
            acc[key] = this.maskPhone(value);
          } else {
            acc[key] = value;
          }
          return acc;
        }, {})
      : null;

    const entry = this.auditLogRepository.create({
      action,
      user,
      organization,
      ip: ip ? ip.replace(/\d+$/, 'x') : null,
      userAgent: userAgent ? this.maskUserAgent(userAgent) : null,
      details: sanitizedDetails
    });

    await this.auditLogRepository.save(entry);
  }

  private maskEmail(email: string): string {
    const [local] = email.split('@');
    return `${local.slice(0, 2)}***@***`;
  }

  private maskPhone(phone: string): string {
    return `+44***${phone.slice(-4)}`;
  }

  private maskUserAgent(ua: string): string {
    const match = ua.match(/(Chrome|Safari|Firefox|Edge)\/([\d.]+)/);
    return match ? `${match[1]}/${match[2].split('.')[0]}` : 'Unknown';
  }
}
