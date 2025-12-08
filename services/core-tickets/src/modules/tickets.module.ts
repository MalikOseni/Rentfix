import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@rentfix/config';
import { TicketsController } from '../controllers/tickets.controller';
import { TicketStateHistory } from '../entities/ticket-state-history.entity';
import { Ticket } from '../entities/ticket.entity';
import { TicketAssignment } from '../entities/ticket-assignment.entity';
import { AccessTokenStrategy } from '../strategies/access-token.strategy';
import { TicketsService } from '../services/tickets.service';
import { TenantGuard } from '../shared/guards/tenant.guard';
import { RbacGuard } from '../shared/guards/rbac.guard';
import { LoggerModule } from '../shared/logger/logger.module';

@Module({
  imports: [
    NestConfigModule.forRoot({ isGlobal: true }),
    ConfigModule.register({ serviceName: 'core-tickets' }),
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'rentfix',
        entities: [Ticket, TicketStateHistory, TicketAssignment],
        synchronize: false,
        logging: process.env.TYPEORM_LOGGING === 'true'
      })
    }),
    TypeOrmModule.forFeature([Ticket, TicketStateHistory, TicketAssignment]),
    LoggerModule
  ],
  controllers: [TicketsController],
  providers: [TicketsService, AccessTokenStrategy, TenantGuard, RbacGuard],
  exports: [TenantGuard, RbacGuard]
})
export class TicketsModule {}
