import { Module } from '@nestjs/common';
import { ConfigModule } from '@rentfix/config';
import { MatchingController } from '../controllers/matching.controller';

@Module({
  imports: [ConfigModule.register({ serviceName: 'core-matching' })],
  controllers: [MatchingController]
})
export class MatchingModule {}
