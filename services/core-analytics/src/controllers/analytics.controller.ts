import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class AnalyticsController {
  @Get()
  health() {
    return {
      status: 'ok',
      message: 'Analytics service ready',
      endpoints: ['GET /analytics/overview', 'GET /analytics/contractors', 'GET /analytics/properties']
    };
  }
}
