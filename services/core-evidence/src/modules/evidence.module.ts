import { Module } from '@nestjs/common';
import { ConfigModule } from '@rentfix/config';
import { EvidenceController } from '../controllers/evidence.controller';

@Module({
  imports: [ConfigModule.register({ serviceName: 'core-evidence' })],
  controllers: [EvidenceController]
})
export class EvidenceModule {}
