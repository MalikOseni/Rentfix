import { NestFactory } from '@nestjs/core';
import { NotificationsModule } from './modules/notifications.module';

async function bootstrap() {
  const app = await NestFactory.create(NotificationsModule, { bufferLogs: true });
  app.setGlobalPrefix('notify');
  await app.listen(process.env.PORT || 4500);
}

bootstrap();
