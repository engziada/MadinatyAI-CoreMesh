import { INestApplication, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaService, TenantContextService } from '@madinatyai/prisma';
import { TenantGuard, TenantMiddleware } from '@madinatyai/tenancy';
import { TenantController } from '../src/modules/tenant/tenant.controller';
import { TenantItemsService } from '../src/modules/tenant/tenant-items.service';

/**
 * Verifies multi-tenant request isolation at the routing layer WITHOUT a live
 * database: the Tenant lookup is mocked, so the test deterministically asserts
 * that subdomain/x-tenant-id resolves to the correct physical schema and that
 * missing/unknown/unprovisioned tenants are rejected.
 */
const SCHEMA_BY_SUBDOMAIN: Record<string, string> = {
  souq: 'tenant_souq',
  kitchen: 'tenant_kitchen',
};

const prismaMock = {
  tenant: {
    findUnique: ({ where: { subdomain } }: { where: { subdomain: string } }) => {
      const schemaName = SCHEMA_BY_SUBDOMAIN[subdomain];
      if (!schemaName) return Promise.resolve(null);
      return Promise.resolve({
        id: `t-${subdomain}`,
        subdomain,
        schemaName,
        isActive: true,
        tierLevel: 'FREE',
      });
    },
  },
};

@Module({
  controllers: [TenantController],
  providers: [
    { provide: PrismaService, useValue: prismaMock },
    {
      provide: ConfigService,
      useValue: { get: (k: string) => (k === 'rootDomain' ? 'madinatyai.com' : undefined) },
    },
    TenantContextService,
    TenantGuard,
    TenantItemsService,
    TenantMiddleware,
  ],
})
class TestTenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}

describe('Tenant routing & isolation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [TestTenantModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('resolves the souq tenant to the tenant_souq schema', async () => {
    const res = await request(app.getHttpServer())
      .get('/tenant/context')
      .set('x-tenant-id', 'souq')
      .expect(200);
    expect(res.body.schemaName).toBe('tenant_souq');
    expect(res.body.subdomain).toBe('souq');
  });

  it('isolates a different tenant to its own schema', async () => {
    const res = await request(app.getHttpServer())
      .get('/tenant/context')
      .set('x-tenant-id', 'kitchen')
      .expect(200);
    expect(res.body.schemaName).toBe('tenant_kitchen');
  });

  it('rejects a request with no tenant (400)', async () => {
    await request(app.getHttpServer()).get('/tenant/context').expect(400);
  });

  it('rejects an unknown tenant (400)', async () => {
    await request(app.getHttpServer())
      .get('/tenant/context')
      .set('x-tenant-id', 'bogus')
      .expect(400);
  });

  it('rejects a known-but-unprovisioned tenant (400)', async () => {
    await request(app.getHttpServer())
      .get('/tenant/context')
      .set('x-tenant-id', 'tutor')
      .expect(400);
  });
});
