import { NestFactory } from '@nestjs/core';
import { AuthModule } from './modules/auth.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule, { bufferLogs: true });
  app.setGlobalPrefix('auth');
  await app.listen(process.env.PORT || 4100);
}

bootstrap();
