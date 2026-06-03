import { INestApplication, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaService, TenantContextService } from '@madinatyai/prisma';
import { TenantGuard, TenantMiddleware } from '@madinatyai/tenancy';
import { SoukElKantoService } from '../src/modules/soukelkanto/soukelkanto.service';
import { CategoriesController } from '../src/modules/soukelkanto/categories/categories.controller';
import { ListingsController } from '../src/modules/soukelkanto/listings/listings.controller';
import { SafeSpotsController } from '../src/modules/soukelkanto/safe-spots/safe-spots.controller';
import { HealthController } from '../src/modules/soukelkanto/health/health.controller';
import { EventsService } from '@madinatyai/events';
import { TokensService } from '@madinatyai/tokens';
import { AiRouterService } from '@madinatyai/ai-router';

/**
 * Souk ElKanto E2E tests — verifies tenant routing, category listing,
 * and safe-meet-spots endpoints under the kanto tenant WITHOUT a live DB.
 */
const prismaMock = {
  tenant: {
    findUnique: ({ where: { subdomain } }: { where: { subdomain: string } }) => {
      if (subdomain !== 'kanto') return Promise.resolve(null);
      return Promise.resolve({
        id: 't-kanto',
        subdomain: 'kanto',
        schemaName: 'tenant_soukelkanto',
        isActive: true,
        tierLevel: 'STANDARD',
      });
    },
  },
  soukListing: {
    findMany: () => Promise.resolve([]),
    count: () => Promise.resolve(0),
  },
  soukSafeMeetSpot: {
    findMany: () =>
      Promise.resolve([
        { id: 's1', name: 'Spot 1', district: 'GATE', latitude: 30.1, longitude: 31.6 },
      ]),
  },
};

const eventsMock = { emit: () => Promise.resolve() };
const tokensMock = { spend: () => Promise.resolve(), credit: () => Promise.resolve() };
const aiMock = {};

@Module({
  controllers: [CategoriesController, ListingsController, SafeSpotsController, HealthController],
  providers: [
    SoukElKantoService,
    { provide: PrismaService, useValue: prismaMock },
    { provide: EventsService, useValue: eventsMock },
    { provide: TokensService, useValue: tokensMock },
    { provide: AiRouterService, useValue: aiMock },
    {
      provide: ConfigService,
      useValue: { get: (k: string) => (k === 'rootDomain' ? 'madinatyai.com' : undefined) },
    },
    TenantContextService,
    TenantGuard,
    TenantMiddleware,
  ],
})
class TestSoukModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}

describe('SoukElKanto (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [TestSoukModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const tenantHeader = { 'x-tenant-id': 'kanto' };

  it('GET /api/v1/health should return ok', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe('ok');
      });
  });

  it('GET /api/v1/categories without tenant should 400', () => {
    return request(app.getHttpServer()).get('/api/v1/categories').expect(400);
  });

  it('GET /api/v1/categories with kanto tenant should list categories', () => {
    return request(app.getHttpServer())
      .get('/api/v1/categories')
      .set(tenantHeader)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
      });
  });

  it('GET /api/v1/listings with kanto tenant should return empty or listings', () => {
    return request(app.getHttpServer())
      .get('/api/v1/listings')
      .set(tenantHeader)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeDefined();
        expect(res.body.pagination).toBeDefined();
      });
  });

  it('GET /api/v1/safe-meet-spots with kanto tenant should return spots', () => {
    return request(app.getHttpServer())
      .get('/api/v1/safe-meet-spots')
      .set(tenantHeader)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
