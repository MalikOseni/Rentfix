import 'reflect-metadata';
import ddTrace from 'dd-trace';
import * as Sentry from '@sentry/node';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AuthModule } from './modules/auth.module';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';

// Initialize APM and error tracking
if (process.env.DD_TRACE_ENABLED === 'true') {
  ddTrace.init({
    serviceName: 'core-auth',
    environment: process.env.NODE_ENV || 'development'
  });
}

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AuthModule, { bufferLogs: true });
  
  app.setGlobalPrefix('auth');
  app.enableVersioning({ type: VersioningType.URI });
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
      transformOptions: { enableImplicitConversion: true }
    })
  );
  
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = process.env.PORT || 4100;
  await app.listen(port);
  console.log(`Auth service listening on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start auth service:', error);
  process.exit(1);
});