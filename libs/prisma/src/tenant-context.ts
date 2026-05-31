import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

/** Resolved tenant attached to the current request lifecycle. */
export interface TenantContext {
  tenantId: string;
  subdomain: string;
  /** Physical PostgreSQL schema pointer, e.g. "tenant_souq". */
  schemaName: string;
  tierLevel: string;
}

/**
 * Request-scoped tenant context backed by AsyncLocalStorage, so any service
 * deep in the call stack can read the active tenant without prop drilling.
 * This is the dynamic "schema pointer" carried per request.
 */
@Injectable()
export class TenantContextService {
  private readonly als = new AsyncLocalStorage<TenantContext>();

  /** Run a callback with the given tenant bound to the async context. */
  run<T>(context: TenantContext, callback: () => T): T {
    return this.als.run(context, callback);
  }

  /** Get the active tenant context, or undefined when outside a tenant scope. */
  get(): TenantContext | undefined {
    return this.als.getStore();
  }

  /** Get the active tenant context or throw if none is bound. */
  getOrThrow(): TenantContext {
    const ctx = this.als.getStore();
    if (!ctx) {
      throw new Error('No tenant context bound to the current request');
    }
    return ctx;
  }
}
