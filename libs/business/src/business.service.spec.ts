import { BusinessService } from './business.service';
import { BusinessNotFoundException } from './exceptions/business-not-found.exception';
import { DuplicateSlugException } from './exceptions/duplicate-slug.exception';

describe('BusinessService', () => {
  const kitchenDelegate = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const tutorDelegate = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const prisma = {
    withTenantSchema: jest.fn(
      (_schema: string, callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
        const tx = {
          kitchenBusiness: kitchenDelegate,
          tutorBusiness: tutorDelegate,
        };
        return callback(tx);
      },
    ),
  };

  const service = new BusinessService(
    prisma as unknown as ConstructorParameters<typeof BusinessService>[0],
  );

  beforeEach(() => jest.clearAllMocks());

  // ── Kitchen ──

  it('creates a kitchen business with owner from JWT (R-11 F-06)', async () => {
    kitchenDelegate.findUnique.mockResolvedValue(null);
    kitchenDelegate.create.mockResolvedValue({
      id: 'b-1',
      slug: 'ali-kitchen',
      name: 'Ali Kitchen',
    });

    const result = await service.createBusiness('kitchen', 'u-1', {
      slug: 'ali-kitchen',
      name: 'Ali Kitchen',
      cuisineType: 'Egyptian',
    });

    expect(result.slug).toBe('ali-kitchen');
    expect(kitchenDelegate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cuisineType: 'Egyptian',
          ownerGlobalUserId: 'u-1', // bound from the controller's @CurrentUser
        }),
      }),
    );
  });

  it('throws DuplicateSlugException when slug is taken', async () => {
    kitchenDelegate.findUnique.mockResolvedValue({ id: 'b-existing', slug: 'ali-kitchen' });

    await expect(
      service.createBusiness('kitchen', 'u-1', {
        slug: 'ali-kitchen',
        name: 'Ali Kitchen',
      }),
    ).rejects.toBeInstanceOf(DuplicateSlugException);
  });

  it('gets a kitchen business by slug', async () => {
    kitchenDelegate.findUnique.mockResolvedValue({
      id: 'b-1',
      slug: 'ali-kitchen',
      name: 'Ali Kitchen',
    });

    const result = await service.getBusiness('kitchen', 'ali-kitchen');

    expect(result.slug).toBe('ali-kitchen');
  });

  it('throws BusinessNotFoundException for unknown slug', async () => {
    kitchenDelegate.findUnique.mockResolvedValue(null);

    await expect(service.getBusiness('kitchen', 'unknown')).rejects.toBeInstanceOf(
      BusinessNotFoundException,
    );
  });

  it('lists kitchen businesses', async () => {
    kitchenDelegate.findMany.mockResolvedValue([
      { id: 'b-1', slug: 'ali-kitchen', name: 'Ali Kitchen', isActive: true },
      { id: 'b-2', slug: 'sara-sushi', name: 'Sara Sushi', isActive: true },
    ]);

    const result = await service.listBusinesses('kitchen');

    expect(result).toHaveLength(2);
    expect(kitchenDelegate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });

  it('updates kitchen business branding', async () => {
    kitchenDelegate.update.mockResolvedValue({
      id: 'b-1',
      branding: { primaryColor: '#FF0000' },
    });

    const result = await service.updateBranding('kitchen', 'b-1', {
      branding: { primaryColor: '#FF0000' },
    });

    expect(result.branding).toEqual({ primaryColor: '#FF0000' });
  });

  it('updates kitchen business profile', async () => {
    kitchenDelegate.update.mockResolvedValue({
      id: 'b-1',
      name: 'Ali Updated',
      cuisineType: 'Asian',
    });

    const result = await service.updateProfile('kitchen', 'b-1', {
      name: 'Ali Updated',
      cuisineType: 'Asian',
    });

    expect(result.name).toBe('Ali Updated');
  });

  it('deactivates a kitchen business', async () => {
    kitchenDelegate.update.mockResolvedValue({ id: 'b-1', isActive: false });

    const result = await service.deactivateBusiness('kitchen', 'b-1');

    expect(result.isActive).toBe(false);
    expect(kitchenDelegate.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } }),
    );
  });

  // ── Tutor ──

  it('creates a tutor business with subjects', async () => {
    tutorDelegate.findUnique.mockResolvedValue(null);
    tutorDelegate.create.mockResolvedValue({
      id: 't-1',
      slug: 'ahmed-math',
      name: 'Ahmed Math',
      subjects: ['Math', 'Physics'],
    });

    const result = await service.createBusiness('tutor', 'u-1', {
      slug: 'ahmed-math',
      name: 'Ahmed Math',
      subjects: '["Math","Physics"]',
      qualifications: 'PhD',
    });

    expect(result.slug).toBe('ahmed-math');
    expect(tutorDelegate.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ subjects: ['Math', 'Physics'] }) }),
    );
  });

  it('lists tutor businesses including inactive', async () => {
    tutorDelegate.findMany.mockResolvedValue([
      { id: 't-1', slug: 'ahmed-math', isActive: true },
      { id: 't-2', slug: 'old-tutor', isActive: false },
    ]);

    const result = await service.listBusinesses('tutor', false);

    expect(result).toHaveLength(2);
    expect(tutorDelegate.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });
});
