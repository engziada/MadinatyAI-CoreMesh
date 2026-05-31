import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TenantMiddleware } from './tenant.middleware';
import { TenantGuard } from './tenant.guard';

/**
 * Wires the tenant-resolution middleware across all routes and exposes the
 * {@link TenantGuard} for controllers that must be tenant-scoped.
 */
@Module({
  providers: [TenantGuard],
  exports: [TenantGuard],
})
export class TenancyModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
