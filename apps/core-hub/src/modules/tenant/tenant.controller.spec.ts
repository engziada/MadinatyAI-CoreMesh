import { TenantController } from './tenant.controller';
import { TenantItemsService } from './tenant-items.service';
import { TenantContextService } from '@madinatyai/prisma';

describe('TenantController', () => {
  const tenantContext = {
    getOrThrow: jest.fn().mockReturnValue({ id: 't-souq', subdomain: 'souq', schemaName: 'tenant_souq' }),
  };
  const itemsService = {
    create: jest.fn().mockResolvedValue({ id: 'item-1' }),
    list: jest.fn().mockResolvedValue([{ id: 'item-1' }]),
  };

  const controller = new TenantController(
    tenantContext as unknown as TenantContextService,
    itemsService as unknown as TenantItemsService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns the current tenant context', () => {
    const ctx = controller.context();
    expect(ctx.subdomain).toBe('souq');
    expect(ctx.schemaName).toBe('tenant_souq');
  });

  it('creates a tenant-scoped item', async () => {
    const result = await controller.createItem('u-1', 'Laptop');
    expect(itemsService.create).toHaveBeenCalledWith('u-1', 'Laptop');
    expect((result as { id: string }).id).toBe('item-1');
  });

  it('lists tenant-scoped items', async () => {
    const result = await controller.listItems();
    expect(itemsService.list).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'item-1' }]);
  });
});
