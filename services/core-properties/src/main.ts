import { NestFactory } from '@nestjs/core';
import { PropertiesModule } from './modules/properties.module';

async function bootstrap() {
  const app = await NestFactory.create(PropertiesModule, { bufferLogs: true });
  app.setGlobalPrefix('properties');
  await app.listen(process.env.PORT || 4200);
}

bootstrap();
