import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Attach required roles to a route handler or controller.
 * Enforced by {@link RolesGuard}.
 *
 * @example
 * @Roles('PLATFORM_ADMIN')
 * @Get('admin')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
