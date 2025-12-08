import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AccessTokenGuard } from '../shared/guards/access-token.guard';
import { RbacGuard } from '../shared/guards/rbac.guard';
import { TenantGuard } from '../shared/guards/tenant.guard';

@Controller('v1/users')
export class UserController {
  @Get('me')
  @UseGuards(AccessTokenGuard, TenantGuard, RbacGuard)
  me(@Req() req: Request) {
    return {
      id: req.user['sub'],
      email: req.user['email'],
      role: req.user['role'],
      tenantId: req.user['tenantId']
    };
  }
}
