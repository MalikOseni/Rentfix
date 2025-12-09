import 'reflect-metadata';
import ddTrace from 'dd-trace';
import * as Sentry from '@sentry/node';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AuthModule } from './modules/auth.module';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';

ddTrace.init({
  enabled: process.env.DD_TRACE_ENABLED !== 'false'
});

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}

async function bootstrap() {
  const app = await NestFactory.create(AuthModule, { bufferLogs: true });
  app.setGlobalPrefix('auth');
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: true })
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.listen(process.env.PORT || 4100);
}

bootstrap();
