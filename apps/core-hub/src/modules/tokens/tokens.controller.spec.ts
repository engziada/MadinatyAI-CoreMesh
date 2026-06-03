import { TokensController } from './tokens.controller';
import { TokensService } from '@madinatyai/tokens';

describe('TokensController', () => {
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

  beforeEach(() => jest.clearAllMocks());

  it('credits tokens via POST /credit', async () => {
    const result = await controller.credit({ userId: 'u-1', amount: 50, tokenType: 'business' });
    expect(tokensService.credit).toHaveBeenCalledWith('u-1', 50, 'business', undefined);
    expect(result.userId).toBe('u-1');
  });

  it('spends tokens via POST /spend', async () => {
    const result = await controller.spend({
      userId: 'u-1',
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

  it('allocates tokens via POST /allocate', async () => {
    await controller.allocate({
      userId: 'u-1',
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
