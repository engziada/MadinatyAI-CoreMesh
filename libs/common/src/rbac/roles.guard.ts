import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

/**
 * Role-Based Access Control guard. Reads the roles required by the handler
 * (via {@link Roles}) and compares against `request.user.role`.
 *
 * NOTE: This is RBAC scaffolding. The authenticated principal
 * (`request.user`) is expected to be populated by the auth layer, which is
 * wired in a later phase. When no roles are required, access is allowed.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const role: string | undefined = request?.user?.role;

    if (!role || !requiredRoles.includes(role)) {
      throw new ForbiddenException('Insufficient role for this resource');
    }
    return true;
  }
}
