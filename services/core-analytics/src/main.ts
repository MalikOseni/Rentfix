import { NestFactory } from '@nestjs/core';
import { AnalyticsModule } from './modules/analytics.module';

async function bootstrap() {
  const app = await NestFactory.create(AnalyticsModule, { bufferLogs: true });
  app.setGlobalPrefix('analytics');
  await app.listen(process.env.PORT || 4800);
}

bootstrap();
