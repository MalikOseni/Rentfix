import { NestFactory } from '@nestjs/core';
import { PaymentsModule } from './modules/payments.module';

async function bootstrap() {
  const app = await NestFactory.create(PaymentsModule, { bufferLogs: true });
  app.setGlobalPrefix('payments');
  await app.listen(process.env.PORT || 4700);
}

bootstrap();
