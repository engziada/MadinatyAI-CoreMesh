import { BusinessMiddleware } from './business.middleware';
import { TenantContextService } from '@madinatyai/prisma';
import type { TenantContext } from '@madinatyai/prisma';

describe('BusinessMiddleware', () => {
  const mockAls = {
    getStore: jest.fn(),
  };

  const tenantContext = {
    get: mockAls.getStore,
  } as unknown as TenantContextService;

  const middleware = new BusinessMiddleware(tenantContext);

  const mockNext = jest.fn();
  const mockRes = {} as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach(() => jest.clearAllMocks());

  it('resolves business slug from x-business-slug header', () => {
    const ctx: TenantContext = {
      tenantId: 't-1',
      subdomain: 'kitchen',
      schemaName: 'tenant_kitchen',
      tierLevel: 'STANDARD',
    };
    mockAls.getStore.mockReturnValue(ctx);

    const req = {
      headers: { 'x-business-slug': 'ali-kitchen' },
      hostname: 'kitchen.madinatyai.com',
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    middleware.use(req, mockRes, mockNext);

    expect(ctx.businessSlug).toBe('ali-kitchen');
    expect(mockNext).toHaveBeenCalled();
  });

  it('skips business resolution for unsupported tenants (souq)', () => {
    const ctx: TenantContext = {
      tenantId: 't-2',
      subdomain: 'souq',
      schemaName: 'tenant_souq',
      tierLevel: 'STANDARD',
    };
    mockAls.getStore.mockReturnValue(ctx);

    const req = { headers: {}, hostname: 'souq.madinatyai.com' } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    middleware.use(req, mockRes, mockNext);

    expect(ctx.businessSlug).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });

  it('skips when no tenant context exists', () => {
    mockAls.getStore.mockReturnValue(undefined);

    const req = { headers: {}, hostname: 'kitchen.madinatyai.com' } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    middleware.use(req, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
