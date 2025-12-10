import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AgentSignupDto } from '../dto/agent-signup.dto';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterDto } from '../dto/register.dto';
import { TokenResponse } from '../dto/token.response';
import { VerifyOtpDto } from '../dto/verify-otp.dto';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto): Promise<TokenResponse> {
    return this.authService.register(body);
  }

  @Post('agent/signup')
  async agentSignup(@Body() body: AgentSignupDto) {
    return this.authService.agentSignup(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto): Promise<TokenResponse> {
    return this.authService.login(body.email, body.password);
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: RefreshTokenDto): Promise<TokenResponse> {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() body: VerifyOtpDto): Promise<TokenResponse> {
    return this.authService.verifyOtp(body);
  }
}