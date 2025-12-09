import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class EvidenceController {
  @Get()
  health() {
    return {
      status: 'ok',
      message: 'Evidence service ready',
      endpoints: ['POST /evidence', 'GET /evidence/:ticketId', 'POST /export/:ticketId']
    };
  }
}
