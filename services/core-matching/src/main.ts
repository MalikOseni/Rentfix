import { NestFactory } from '@nestjs/core';
import { MatchingModule } from './modules/matching.module';

async function bootstrap() {
  const app = await NestFactory.create(MatchingModule, { bufferLogs: true });
  app.setGlobalPrefix('match');
  await app.listen(process.env.PORT || 4400);
}

bootstrap();
