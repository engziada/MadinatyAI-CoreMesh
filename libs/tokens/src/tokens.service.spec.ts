import { TokensService } from './tokens.service';
import { InsufficientTokensException } from './exceptions/insufficient-tokens.exception';
import { InvalidActivityException } from './exceptions/invalid-activity.exception';

describe('TokensService', () => {
  const prisma = {
    tokenWallet: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    tokenTransaction: {
      create: jest.fn(),
    },
    tokenAllocation: {
      upsert: jest.fn(),
    },
    activityPricing: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const service = new TokensService(prisma as unknown as ConstructorParameters<typeof TokensService>[0]);

  beforeEach(() => jest.clearAllMocks());

  it('credits tokens and returns updated wallet', async () => {
    prisma.tokenWallet.upsert.mockResolvedValue({ id: 'w-1', userId: 'u-1', businessTokens: 50, individualTokens: 0 });
    prisma.tokenWallet.findUnique.mockResolvedValue({
      id: 'w-1', userId: 'u-1', businessTokens: 50, individualTokens: 0,
      allocations: [], transactions: [],
    });
    prisma.tokenTransaction.create.mockResolvedValue({});

    const result = await service.credit('u-1', 50, 'business');

    expect(prisma.tokenWallet.upsert).toHaveBeenCalled();
    expect(result.businessTokens).toBe(50);
    expect(result.userId).toBe('u-1');
  });

  it('spends tokens with sufficient balance', async () => {
    prisma.activityPricing.findUnique.mockResolvedValue({ activityType: 'kitchen_rental', cost: 10, isActive: true });
    prisma.tokenWallet.findUnique.mockResolvedValue({ id: 'w-1', userId: 'u-1', businessTokens: 20, individualTokens: 0 });
    prisma.tokenWallet.update.mockResolvedValue({ id: 'w-1', businessTokens: 10, individualTokens: 0 });
    prisma.tokenTransaction.create.mockResolvedValue({});
    prisma.tokenWallet.findUnique.mockResolvedValue({
      id: 'w-1', userId: 'u-1', businessTokens: 10, individualTokens: 0,
      allocations: [], transactions: [],
    });

    const result = await service.spend('u-1', 'kitchen_rental', 'business');

    expect(prisma.tokenWallet.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'u-1' },
      data: { businessTokens: { decrement: 10 } },
    }));
    expect(result.businessTokens).toBe(10);
  });

  it('throws InsufficientTokensException when balance is too low', async () => {
    prisma.activityPricing.findUnique.mockResolvedValue({ activityType: 'kitchen_rental', cost: 10, isActive: true });
    prisma.tokenWallet.findUnique.mockResolvedValue({ id: 'w-1', userId: 'u-1', businessTokens: 5, individualTokens: 0 });

    await expect(service.spend('u-1', 'kitchen_rental', 'business')).rejects.toBeInstanceOf(InsufficientTokensException);
  });

  it('throws InvalidActivityException when activity is not configured', async () => {
    prisma.activityPricing.findUnique.mockResolvedValue(null);

    await expect(service.spend('u-1', 'unknown_activity', 'business')).rejects.toBeInstanceOf(InvalidActivityException);
  });

  it('allocates tokens to an activity', async () => {
    prisma.tokenWallet.findUnique.mockResolvedValue({ id: 'w-1', userId: 'u-1', businessTokens: 100, individualTokens: 0 });
    prisma.tokenAllocation.upsert.mockResolvedValue({ id: 'a-1', walletId: 'w-1', activityType: 'souk_ad', tokenType: 'business', allocatedAmount: 30 });
    prisma.tokenWallet.findUnique.mockResolvedValue({
      id: 'w-1', userId: 'u-1', businessTokens: 100, individualTokens: 0,
      allocations: [{ activityType: 'souk_ad', tokenType: 'business', allocatedAmount: 30 }],
      transactions: [],
    });

    const result = await service.allocate('u-1', 'souk_ad', 'business', 30);

    expect(prisma.tokenAllocation.upsert).toHaveBeenCalled();
    expect(result.allocations[0].allocatedAmount).toBe(30);
  });

  it('throws InsufficientTokensException when allocating more than balance', async () => {
    prisma.tokenWallet.findUnique.mockResolvedValue({ id: 'w-1', userId: 'u-1', businessTokens: 10, individualTokens: 0 });

    await expect(service.allocate('u-1', 'souk_ad', 'business', 20)).rejects.toBeInstanceOf(InsufficientTokensException);
  });

  it('getWallet returns zero balances for new user', async () => {
    prisma.tokenWallet.findUnique.mockResolvedValue(null);

    const result = await service.getWallet('u-new');

    expect(result.businessTokens).toBe(0);
    expect(result.individualTokens).toBe(0);
    expect(result.allocations).toEqual([]);
    expect(result.recentTransactions).toEqual([]);
  });

  it('lists active activity pricing', async () => {
    prisma.activityPricing.findMany.mockResolvedValue([
      { activityType: 'kitchen_rental', cost: 50, description: 'Kitchen rental' },
    ]);

    const result = await service.listActivityPricing();

    expect(result).toEqual([{ activityType: 'kitchen_rental', cost: 50, description: 'Kitchen rental' }]);
  });

  it('sets activity pricing', async () => {
    prisma.activityPricing.upsert.mockResolvedValue({ activityType: 'tutor_premium', cost: 15, description: 'Tutor premium', isActive: true });

    const result = await service.setActivityPricing('tutor_premium', 15, 'Tutor premium listing');

    expect(result.activityType).toBe('tutor_premium');
    expect(result.cost).toBe(15);
  });
});
