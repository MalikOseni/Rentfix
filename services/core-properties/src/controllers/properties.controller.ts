import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class PropertiesController {
  @Get()
  health() {
    return {
      status: 'ok',
      message: 'Properties service ready',
      endpoints: ['GET /properties', 'POST /properties', 'GET /units/:id']
    };
  }
}
