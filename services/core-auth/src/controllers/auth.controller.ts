import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards
} from '@nestjs/common';
import { Request } from 'express';
import { AgentSignupDto } from '../dto/agent-signup.dto';
import { AuthService } from '../services/auth.service';
import { ContractorAuthService } from '../services/contractor-auth.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterDto } from '../dto/register.dto';
import { TokenResponse } from '../dto/token.response';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { RateLimitGuard } from '../shared/guards/rate-limit.guard';
import { RateLimit } from '../shared/decorators/rate-limit.decorator';
import { AccessTokenGuard } from '../shared/guards/access-token.guard';
import { CreateInviteDto } from '../dto/create-invite.dto';
import { AcceptInviteDto } from '../dto/accept-invite.dto';
import { RegisterContractorDto } from '../dto/register-contractor.dto';
import { DeleteAccountDto } from '../dto/delete-account.dto';
import {
  ContractorSignupDto,
  ContractorVerifyOtpDto,
  ContractorLoginDto,
  ContractorResendOtpDto,
  ContractorUpdateProfileDto,
  ContractorDeleteAccountDto
} from '../dto/contractor-signup.dto';

// Extend Express Request to include user property
interface AuthenticatedRequest extends Request {
  user?: { sub: string; email: string; role: string; tenantId: string | null };
}

@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly contractorAuthService: ContractorAuthService
  ) {}

  @Post('register')
  @UseGuards(RateLimitGuard)
  @RateLimit('register')
  async register(@Body() body: RegisterDto): Promise<TokenResponse> {
    return this.authService.register(body);
  }

  @Post('agent/signup')
  async agentSignup(@Body() body: AgentSignupDto) {
    return this.authService.agentSignup(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit('login')
  async login(@Body() body: LoginDto): Promise<TokenResponse> {
    return this.authService.login(body.email, body.password, undefined, body.organizationId);
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: RefreshTokenDto): Promise<TokenResponse> {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshRotated(@Body() body: RefreshTokenDto): Promise<TokenResponse> {
    return this.authService.refreshAccessToken(body.refreshToken);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit('verify-otp')
  async verifyOtp(@Body() body: VerifyOtpDto): Promise<TokenResponse> {
    return this.authService.verifyOtp(body);
  }

  @Post('tenant/invite')
  async createTenantInvite(@Body() body: CreateInviteDto) {
    return this.authService.createTenantInvite(body.agentId, body.propertyId, body.tenantEmail, body.tenantPhone);
  }

  @Post('tenant/accept-invite')
  async acceptInvite(@Body() body: AcceptInviteDto) {
    return this.authService.acceptTenantInvite(body.token, body.name, body.password, body.phone);
  }

  // Legacy contractor registration (kept for backwards compatibility)
  @Post('contractor/register')
  async registerContractor(@Body() body: RegisterContractorDto) {
    return this.authService.registerContractor(
      body.businessName,
      body.specialties,
      body.hourlyRate,
      body.insuranceCertUrl,
      body.bankAccount
    );
  }

  // =====================================
  // CONTRACTOR SELF-SERVICE ENDPOINTS
  // =====================================

  /**
   * Self-service contractor signup - NO INVITE REQUIRED
   * Creates user account, contractor profile, and sends OTP for verification
   */
  @Post('contractor/signup')
  @UseGuards(RateLimitGuard)
  @RateLimit('register')
  async contractorSignup(@Body() body: ContractorSignupDto, @Req() req: Request) {
    const ip = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.contractorAuthService.signup(
      {
        email: body.email,
        password: body.password,
        businessName: body.businessName,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        specialties: body.specialties,
        hourlyRate: body.hourlyRate,
        insuranceCertUrl: body.insuranceCertUrl,
        insuranceExpiry: body.insuranceExpiry ? new Date(body.insuranceExpiry) : undefined,
        bankAccount: body.bankAccount,
        serviceArea: body.serviceArea
      },
      ip,
      userAgent
    );
  }

  /**
   * Verify contractor email via OTP and initiate background check
   */
  @Post('contractor/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit('verify-otp')
  async contractorVerifyOtp(@Body() body: ContractorVerifyOtpDto, @Req() req: Request) {
    const ip = req.ip || req.socket?.remoteAddress;
    return this.contractorAuthService.verifyEmailAndInitiateBackgroundCheck(
      body.temporaryToken,
      body.otp,
      ip
    );
  }

  /**
   * Contractor login
   */
  @Post('contractor/login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit('login')
  async contractorLogin(@Body() body: ContractorLoginDto, @Req() req: Request) {
    const ip = req.ip || req.socket?.remoteAddress;
    return this.contractorAuthService.login(body.email, body.password, ip);
  }

  /**
   * Resend OTP for contractor email verification
   */
  @Post('contractor/resend-otp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit('verify-otp')
  async contractorResendOtp(@Body() body: ContractorResendOtpDto) {
    return this.contractorAuthService.resendOtp(body.email);
  }

  /**
   * Get contractor profile (authenticated)
   */
  @Get('contractor/profile')
  @UseGuards(AccessTokenGuard)
  async getContractorProfile(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const profile = await this.contractorAuthService.getProfile(userId);
    if (!profile) {
      return { error: 'Contractor profile not found' };
    }
    return {
      id: profile.id,
      businessName: profile.businessName,
      specialties: profile.specialties,
      hourlyRate: profile.hourlyRate,
      insuranceCertUrl: profile.insuranceCertUrl,
      insuranceExpiry: profile.insuranceExpiry,
      status: profile.status,
      backgroundCheckStatus: profile.backgroundCheckStatus,
      serviceArea: profile.serviceArea,
      averageRating: profile.averageRating,
      totalJobsCompleted: profile.totalJobsCompleted,
      verified: profile.verifiedAt !== null,
      createdAt: profile.createdAt
    };
  }

  /**
   * Update contractor profile (authenticated)
   */
  @Patch('contractor/profile')
  @UseGuards(AccessTokenGuard)
  async updateContractorProfile(
    @Body() body: ContractorUpdateProfileDto,
    @Req() req: AuthenticatedRequest
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const updated = await this.contractorAuthService.updateProfile(userId, {
      businessName: body.businessName,
      specialties: body.specialties,
      hourlyRate: body.hourlyRate,
      insuranceCertUrl: body.insuranceCertUrl,
      insuranceExpiry: body.insuranceExpiry ? new Date(body.insuranceExpiry) : undefined,
      serviceArea: body.serviceArea,
      phone: body.phone
    });
    return {
      id: updated.id,
      businessName: updated.businessName,
      specialties: updated.specialties,
      hourlyRate: updated.hourlyRate,
      status: updated.status,
      updated: true
    };
  }

  /**
   * Delete contractor account (GDPR compliance)
   */
  @Delete('contractor/account')
  @UseGuards(AccessTokenGuard)
  async deleteContractorAccount(
    @Body() body: ContractorDeleteAccountDto,
    @Req() req: AuthenticatedRequest
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    await this.contractorAuthService.deleteAccount(userId, body.password);
    return { status: 'deleted', message: 'Account successfully deleted' };
  }

  // =====================================
  // EXISTING ACCOUNT DELETION ENDPOINT
  // =====================================

  @Delete('/api/users/me/delete')
  async deleteAccount(@Body() body: DeleteAccountDto) {
    await this.authService.deleteUserAccount(body.userId, body.password);
    return { status: 'deleted' };
  }
}
