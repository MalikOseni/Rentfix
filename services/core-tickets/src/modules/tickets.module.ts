import { Module } from '@nestjs/common';
import { ConfigModule } from '@rentfix/config';
import { TicketsController } from '../controllers/tickets.controller';

@Module({
  imports: [ConfigModule.register({ serviceName: 'core-tickets' })],
  controllers: [TicketsController]
})
export class TicketsModule {}
