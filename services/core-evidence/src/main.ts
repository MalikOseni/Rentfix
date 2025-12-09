import { NestFactory } from '@nestjs/core';
import { EvidenceModule } from './modules/evidence.module';

async function bootstrap() {
  const app = await NestFactory.create(EvidenceModule, { bufferLogs: true });
  app.setGlobalPrefix('evidence');
  await app.listen(process.env.PORT || 4600);
}

bootstrap();
