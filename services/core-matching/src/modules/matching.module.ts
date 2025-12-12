import { Module } from '@nestjs/common';
import { ConfigModule } from '@rentfix/config';
import { MatchingController } from '../controllers/matching.controller';
import { MatchingService } from '../services/matching.service';

@Module({
  imports: [ConfigModule.register({ serviceName: 'core-matching' })],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
