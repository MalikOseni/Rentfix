import { Module } from '@nestjs/common';
import { ConfigModule } from '@rentfix/config';
import { ProxyController } from '../routes/proxy.controller';

@Module({
  imports: [ConfigModule.register({ serviceName: 'api-gateway' })],
  controllers: [ProxyController]
})
export class AppModule {}
