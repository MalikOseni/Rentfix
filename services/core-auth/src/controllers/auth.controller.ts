import { Body, Controller, Delete, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AgentSignupDto } from '../dto/agent-signup.dto';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterDto } from '../dto/register.dto';
import { TokenResponse } from '../dto/token.response';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { RateLimitGuard } from '../shared/guards/rate-limit.guard';
import { RateLimit } from '../shared/decorators/rate-limit.decorator';
import { CreateInviteDto } from '../dto/create-invite.dto';
import { AcceptInviteDto } from '../dto/accept-invite.dto';
import { RegisterContractorDto } from '../dto/register-contractor.dto';
import { DeleteAccountDto } from '../dto/delete-account.dto';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Delete('/api/users/me/delete')
  async deleteAccount(@Body() body: DeleteAccountDto) {
    await this.authService.deleteUserAccount(body.userId, body.password);
    return { status: 'deleted' };
  }
}