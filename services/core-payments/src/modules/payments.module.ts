import { Module } from '@nestjs/common';
import { ConfigModule } from '@rentfix/config';
import { PaymentsController } from '../controllers/payments.controller';

@Module({
  imports: [ConfigModule.register({ serviceName: 'core-payments' })],
  controllers: [PaymentsController]
})
export class PaymentsModule {}
