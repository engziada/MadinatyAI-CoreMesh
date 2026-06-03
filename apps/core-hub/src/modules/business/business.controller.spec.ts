import { BusinessController } from './business.controller';
import { BusinessService } from '@madinatyai/business';
import { TenantContextService } from '@madinatyai/prisma';

describe('BusinessController', () => {
  const mockService = {
    createBusiness: jest.fn(),
    getBusiness: jest.fn(),
    listBusinesses: jest.fn(),
    updateBranding: jest.fn(),
    updateProfile: jest.fn(),
    deactivateBusiness: jest.fn(),
  };

  const mockTenantContext = {
    getOrThrow: jest.fn().mockReturnValue({
      tenantId: 't-kitchen',
      subdomain: 'kitchen',
      schemaName: 'tenant_kitchen',
      tierLevel: 'STANDARD',
    }),
  };

  const controller = new BusinessController(
    mockService as unknown as BusinessService,
    mockTenantContext as unknown as TenantContextService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('creates a business', async () => {
    mockService.createBusiness.mockResolvedValue({ id: 'b-1', slug: 'ali-kitchen' });

    const result = await controller.create({
      ownerGlobalUserId: 'u-1',
      slug: 'ali-kitchen',
      name: 'Ali Kitchen',
    });

    expect(result.slug).toBe('ali-kitchen');
    expect(mockService.createBusiness).toHaveBeenCalledWith('kitchen', expect.any(Object));
  });

  it('gets a business by slug', async () => {
    mockService.getBusiness.mockResolvedValue({ id: 'b-1', slug: 'ali-kitchen' });

    const result = await controller.getBySlug('ali-kitchen');

    expect(result.slug).toBe('ali-kitchen');
  });

  it('lists businesses', async () => {
    mockService.listBusinesses.mockResolvedValue([{ id: 'b-1' }, { id: 'b-2' }]);

    const result = await controller.list('true');

    expect(result).toHaveLength(2);
  });

  it('updates branding', async () => {
    mockService.updateBranding.mockResolvedValue({
      id: 'b-1',
      branding: { primaryColor: '#FF0000' },
    });

    const result = await controller.updateBranding('b-1', {
      branding: { primaryColor: '#FF0000' },
    });

    expect(result.branding).toEqual({ primaryColor: '#FF0000' });
  });

  it('updates profile', async () => {
    mockService.updateProfile.mockResolvedValue({ id: 'b-1', name: 'Updated' });

    const result = await controller.updateProfile('b-1', { name: 'Updated' });

    expect(result.name).toBe('Updated');
  });

  it('deactivates a business', async () => {
    mockService.deactivateBusiness.mockResolvedValue(undefined);

    await controller.deactivate('b-1');

    expect(mockService.deactivateBusiness).toHaveBeenCalledWith('kitchen', 'b-1');
  });
});
