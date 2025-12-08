import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class PaymentsController {
  @Get()
  health() {
    return {
      status: 'ok',
      message: 'Payments service ready',
      endpoints: ['POST /payments/invoice', 'GET /payments/:contractorId']
    };
  }
}
