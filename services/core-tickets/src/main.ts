import { NestFactory } from '@nestjs/core';
import { TicketsModule } from './modules/tickets.module';

async function bootstrap() {
  const app = await NestFactory.create(TicketsModule, { bufferLogs: true });
  app.setGlobalPrefix('tickets');
  await app.listen(process.env.PORT || 4300);
}

bootstrap();
