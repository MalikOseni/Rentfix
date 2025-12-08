import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class NotificationsController {
  @Get()
  health() {
    return {
      status: 'ok',
      message: 'Notifications service ready',
      endpoints: ['POST /notify', 'POST /notify/batch']
    };
  }
}
