import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantHeader = request.headers['x-tenant-id'];

    if (user?.role === 'admin') {
      return true;
    }

    if (!tenantHeader || !user?.tenantId) {
      return false;
    }

    return tenantHeader === user.tenantId;
  }
}
