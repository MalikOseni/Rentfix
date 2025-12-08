import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class TicketsController {
  @Get()
  health() {
    return {
      status: 'ok',
      message: 'Tickets service ready',
      endpoints: ['POST /tickets', 'PATCH /tickets/:id', 'GET /tickets?filter']
    };
  }
}
