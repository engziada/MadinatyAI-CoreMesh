import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@madinatyai/prisma';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedUser, JwtPayload } from '../types/authenticated-user';

/**
 * Verifies the Bearer JWT, looks up the GlobalUser, hydrates
 * `request.user: AuthenticatedUser`. Routes annotated with {@link Public}
 * bypass this guard entirely.
 *
 * Intended to be registered as an APP_GUARD in Phase A.2 so it runs
 * globally on every request unless explicitly opted out.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: AuthenticatedUser;
    }>();

    const token = this.extractBearer(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Missing Authorization: Bearer <jwt>');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch (err) {
      this.logger.debug(`JWT verify failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.prisma.globalUser.findUnique({
      where: { id: payload.sub },
      select: { id: true, phoneNumber: true, role: true },
    });
    if (!user) {
      throw new UnauthorizedException('Token subject no longer exists');
    }

    request.user = user;
    return true;
  }

  private extractBearer(headerValue?: string | string[]): string | undefined {
    const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    if (!raw) return undefined;
    const [scheme, token] = raw.split(' ');
    if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return undefined;
    return token.trim();
  }
}
