import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class MatchingController {
  @Get()
  health() {
    return {
      status: 'ok',
      message: 'Matching service ready',
      endpoints: ['POST /match/ticket/:id', 'PATCH /assignments/:id']
    };
  }
}
