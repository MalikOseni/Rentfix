import { Module } from '@nestjs/common';
import { ConfigModule } from '@rentfix/config';
import { NotificationsController } from '../controllers/notifications.controller';

@Module({
  imports: [ConfigModule.register({ serviceName: 'core-notifications' })],
  controllers: [NotificationsController]
})
export class NotificationsModule {}
