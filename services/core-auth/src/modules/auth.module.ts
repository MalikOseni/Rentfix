import { Module } from '@nestjs/common';
import { ConfigModule } from '@rentfix/config';
import { AuthController } from '../controllers/auth.controller';

@Module({
  imports: [ConfigModule.register({ serviceName: 'core-auth' })],
  controllers: [AuthController]
})
export class AuthModule {}
