import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@rentfix/config';
import { AuthController } from '../controllers/auth.controller';
import { UserController } from '../controllers/user.controller';
import { Permission } from '../entities/permission.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { AccessTokenStrategy } from '../strategies/access-token.strategy';
import { RefreshTokenStrategy } from '../strategies/refresh-token.strategy';
import { AuthService } from '../services/auth.service';
import { PasswordService } from '../services/password.service';
import { TokenService } from '../services/token.service';
import { TenantGuard } from '../shared/guards/tenant.guard';
import { RbacGuard } from '../shared/guards/rbac.guard';
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
        entities: [User, Role, Permission, RefreshToken],
        synchronize: false,
        logging: process.env.TYPEORM_LOGGING === 'true'
      })
    }),
    TypeOrmModule.forFeature([User, Role, Permission, RefreshToken]),
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
    RbacGuard
  ],
  exports: [TenantGuard, RbacGuard, TokenService]
})
export class AuthModule {}
