import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../types/authenticated-user';

/**
 * Inject the authenticated principal from the Express request.
 *
 * @example
 * create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateListingDto) {
 *   return this.service.create(user.id, dto);
 * }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    if (!request.user) {
      throw new Error(
        'CurrentUser decorator used on a route without JwtAuthGuard. ' +
          'Either remove @Public() or guard the route with JwtAuthGuard.',
      );
    }
    return request.user;
  },
);
