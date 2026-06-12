/**
 * BusinessController unit tests.
 *
 * Updated for R-11 F-06: `ownerGlobalUserId` is now bound from @CurrentUser
 * (not the DTO) on create. Mutate endpoints (updateBranding, updateProfile,
 * deactivate) load the row and assert caller is the owner — `loadById` is
 * a new BusinessService method.
 */

import { ForbiddenException } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from '@madinatyai/business';
import { TenantContextService } from '@madinatyai/prisma';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

describe('BusinessController', () => {
  const owner: AuthenticatedUser = {
    id: 'u-1',
    phoneNumber: '+201000000001',
    role: 'USER',
  } as AuthenticatedUser;

  const otherUser: AuthenticatedUser = {
    id: 'u-2',
    phoneNumber: '+201000000002',
    role: 'USER',
  } as AuthenticatedUser;

  const mockService = {
    createBusiness: jest.fn(),
    getBusiness: jest.fn(),
    listBusinesses: jest.fn(),
    updateBranding: jest.fn(),
    updateProfile: jest.fn(),
    deactivateBusiness: jest.fn(),
    loadById: jest.fn(),
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

  it('creates a business with owner from JWT (R-11 F-06)', async () => {
    mockService.createBusiness.mockResolvedValue({ id: 'b-1', slug: 'ali-kitchen' });

    const result = await controller.create(owner, {
      slug: 'ali-kitchen',
      name: 'Ali Kitchen',
    });

    expect(result.slug).toBe('ali-kitchen');
    expect(mockService.createBusiness).toHaveBeenCalledWith(
      'kitchen',
      'u-1',
      expect.objectContaining({ slug: 'ali-kitchen', name: 'Ali Kitchen' }),
    );
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

  it('updates branding when caller owns the business', async () => {
    mockService.loadById.mockResolvedValue({ id: 'b-1', ownerGlobalUserId: 'u-1' });
    mockService.updateBranding.mockResolvedValue({
      id: 'b-1',
      branding: { primaryColor: '#FF0000' },
    });

    const result = await controller.updateBranding(owner, 'b-1', {
      branding: { primaryColor: '#FF0000' },
    });

    expect(result.branding).toEqual({ primaryColor: '#FF0000' });
  });

  it('rejects updateBranding from non-owner (R-11 F-06)', async () => {
    mockService.loadById.mockResolvedValue({ id: 'b-1', ownerGlobalUserId: 'u-1' });

    await expect(
      controller.updateBranding(otherUser, 'b-1', { branding: { primaryColor: '#000' } }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(mockService.updateBranding).not.toHaveBeenCalled();
  });

  it('updates profile when caller owns the business', async () => {
    mockService.loadById.mockResolvedValue({ id: 'b-1', ownerGlobalUserId: 'u-1' });
    mockService.updateProfile.mockResolvedValue({ id: 'b-1', name: 'Updated' });

    const result = await controller.updateProfile(owner, 'b-1', { name: 'Updated' });

    expect(result.name).toBe('Updated');
  });

  it('deactivates when caller owns the business', async () => {
    mockService.loadById.mockResolvedValue({ id: 'b-1', ownerGlobalUserId: 'u-1' });
    mockService.deactivateBusiness.mockResolvedValue(undefined);

    await controller.deactivate(owner, 'b-1');

    expect(mockService.deactivateBusiness).toHaveBeenCalledWith('kitchen', 'b-1');
  });

  it('rejects deactivate from non-owner (R-11 F-06)', async () => {
    mockService.loadById.mockResolvedValue({ id: 'b-1', ownerGlobalUserId: 'u-1' });

    await expect(controller.deactivate(otherUser, 'b-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(mockService.deactivateBusiness).not.toHaveBeenCalled();
  });

  it('returns 403 when target business is missing', async () => {
    mockService.loadById.mockResolvedValue(null);

    await expect(
      controller.updateBranding(owner, 'b-missing', { branding: {} }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
