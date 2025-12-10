import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@rentfix/config';
import { AuthController } from '../controllers/auth.controller';
import { UserController } from '../controllers/user.controller';
import { AuditLog } from '../entities/audit-log.entity';
import { Organization } from '../entities/organization.entity';
import { Otp } from '../entities/otp.entity';
import { Permission } from '../entities/permission.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { Role } from '../entities/role.entity';
import { TenantInvite } from '../entities/tenant-invite.entity';
import { User } from '../entities/user.entity';
import { LoginAttemptEntity } from '../database/entities/login-attempt.entity';
import { AccessTokenStrategy } from '../strategies/access-token.strategy';
import { RefreshTokenStrategy } from '../strategies/refresh-token.strategy';
import { AuthService } from '../services/auth.service';
import { PasswordService } from '../services/password.service';
import { TokenService } from '../services/token.service';
import { TenantGuard } from '../shared/guards/tenant.guard';
import { RbacGuard } from '../shared/guards/rbac.guard';
import { RateLimitGuard } from '../shared/guards/rate-limit.guard';
import { LoggerModule } from '../shared/logger/logger.module';

@Module({
  imports: [
    NestConfigModule.forRoot({ isGlobal: true }),
    ConfigModule.register({ serviceName: 'core-auth' }),
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    JwtModule.register({}),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'rentfix',
        entities: [User, Role, Permission, RefreshToken, Organization, Otp, AuditLog, LoginAttemptEntity],
        synchronize: false,
        logging: process.env.TYPEORM_LOGGING === 'true'
      })
    }),
    TypeOrmModule.forFeature([User, Role, Permission, RefreshToken, Organization, Otp, AuditLog, TenantInvite, LoginAttemptEntity]),
    LoggerModule
  ],
  controllers: [AuthController, UserController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    TenantGuard,
    RbacGuard,
    RateLimitGuard
  ],
  exports: [TenantGuard, RbacGuard, TokenService]
})
export class AuthModule {}
