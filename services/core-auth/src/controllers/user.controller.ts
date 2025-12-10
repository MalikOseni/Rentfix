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
    const user = req.user as Record<string, unknown> | undefined;
    return {
      id: user?.['sub'] ?? null,
      email: user?.['email'] ?? null,
      role: user?.['role'] ?? null,
      tenantId: user?.['tenantId'] ?? null
    };
  }
}
