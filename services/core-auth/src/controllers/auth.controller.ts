import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class AuthController {
  @Get()
  health() {
    return {
      status: 'ok',
      message: 'Auth service ready',
      endpoints: ['POST /auth/login', 'POST /auth/register', 'GET /users/me']
    };
  }
}
