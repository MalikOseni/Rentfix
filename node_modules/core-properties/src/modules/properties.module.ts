import { Module } from '@nestjs/common';
import { ConfigModule } from '@rentfix/config';
import { PropertiesController } from '../controllers/properties.controller';

@Module({
  imports: [ConfigModule.register({ serviceName: 'core-properties' })],
  controllers: [PropertiesController]
})
export class PropertiesModule {}
