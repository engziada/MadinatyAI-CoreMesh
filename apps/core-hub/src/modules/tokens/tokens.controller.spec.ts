/**
 * TokensController unit tests.
 *
 * Updated for R-11 F-03: spend/allocate now bind userId from @CurrentUser
 * instead of accepting it in the body. Tests pass a `user` argument as the
 * controller's first parameter to mirror what the guard chain would inject
 * at runtime.
 */

import { TokensController } from './tokens.controller';
import { TokensService } from '@madinatyai/tokens';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

describe('TokensController', () => {
  const user: AuthenticatedUser = {
    id: 'u-1',
    phoneNumber: '+201000000001',
    role: 'USER',
  } as AuthenticatedUser;

  const adminUser: AuthenticatedUser = {
    id: 'admin-1',
    phoneNumber: '+201999999999',
    role: 'PLATFORM_ADMIN',
  } as AuthenticatedUser;

  const tokensService = {
    credit: jest.fn().mockResolvedValue({ userId: 'u-1', businessTokens: 50, individualTokens: 0 }),
    spend: jest.fn().mockResolvedValue({ userId: 'u-1', businessTokens: 40, individualTokens: 0 }),
    allocate: jest
      .fn()
      .mockResolvedValue({ userId: 'u-1', businessTokens: 100, individualTokens: 0 }),
    getWallet: jest
      .fn()
      .mockResolvedValue({ userId: 'u-1', businessTokens: 100, individualTokens: 20 }),
    listActivityPricing: jest
      .fn()
      .mockResolvedValue([{ activityType: 'kitchen_rental', cost: 50 }]),
    setActivityPricing: jest.fn().mockResolvedValue({ activityType: 'kitchen_rental', cost: 50 }),
  };

  const controller = new TokensController(tokensService as unknown as TokensService);
  // Suppress the unused-but-real reference to adminUser — kept for symmetry
  // with the role-protected endpoints whose guard isn't part of this unit test.
  void adminUser;

  beforeEach(() => jest.clearAllMocks());

  it('credits tokens via POST /credit', async () => {
    const result = await controller.credit({ userId: 'u-1', amount: 50, tokenType: 'business' });
    expect(tokensService.credit).toHaveBeenCalledWith('u-1', 50, 'business', undefined);
    expect(result.userId).toBe('u-1');
  });

  it('spends tokens via POST /spend (actor from JWT, NOT body)', async () => {
    const result = await controller.spend(user, {
      activityType: 'kitchen_rental',
      tokenType: 'business',
    });
    expect(tokensService.spend).toHaveBeenCalledWith(
      'u-1',
      'kitchen_rental',
      'business',
      undefined,
    );
    expect(result.businessTokens).toBe(40);
  });

  it('allocates tokens via POST /allocate (actor from JWT, NOT body)', async () => {
    await controller.allocate(user, {
      activityType: 'souk_ad',
      tokenType: 'business',
      amount: 30,
    });
    expect(tokensService.allocate).toHaveBeenCalledWith('u-1', 'souk_ad', 'business', 30);
  });

  it('returns wallet via GET /wallet', async () => {
    const result = await controller.wallet('u-1');
    expect(tokensService.getWallet).toHaveBeenCalledWith('u-1');
    expect(result.businessTokens).toBe(100);
  });

  it('lists pricing via GET /pricing', async () => {
    const result = await controller.pricing();
    expect(tokensService.listActivityPricing).toHaveBeenCalled();
    expect(result[0].activityType).toBe('kitchen_rental');
  });

  it('sets pricing via POST /pricing', async () => {
    const result = await controller.setPricing({
      activityType: 'kitchen_rental',
      cost: 50,
      description: 'Kitchen rental',
    });
    expect(tokensService.setActivityPricing).toHaveBeenCalledWith(
      'kitchen_rental',
      50,
      'Kitchen rental',
      undefined,
    );
    expect(result.activityType).toBe('kitchen_rental');
  });
});
