import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class ProxyController {
  @Get()
  readiness() {
    return {
      status: 'ok',
      message: 'API Gateway online',
      services: ['auth', 'tickets', 'matching', 'notifications']
    };
  }
}
