import { Module } from '@nestjs/common';
import { ConfigModule } from '@rentfix/config';
import { AnalyticsController } from '../controllers/analytics.controller';

@Module({
  imports: [ConfigModule.register({ serviceName: 'core-analytics' })],
  controllers: [AnalyticsController]
})
export class AnalyticsModule {}
