import { InMemoryRateLimitStrategy } from './in-memory-rate-limit.strategy';

describe('InMemoryRateLimitStrategy', () => {
  let strategy: InMemoryRateLimitStrategy;

  beforeEach(() => {
    strategy = new InMemoryRateLimitStrategy();
  });

  it('should allow requests within the limit', async () => {
    const entry = await strategy.consume('user:1', 60_000, 10);
    expect(entry.remaining).toBe(9);
  });

  it('should count down remaining requests', async () => {
    for (let i = 0; i < 5; i++) {
      await strategy.consume('user:1', 60_000, 10);
    }
    const entry = await strategy.consume('user:1', 60_000, 10);
    expect(entry.remaining).toBe(4);
  });

  it('should return 0 remaining when limit is exceeded', async () => {
    for (let i = 0; i < 10; i++) {
      await strategy.consume('user:1', 60_000, 10);
    }
    const entry = await strategy.consume('user:1', 60_000, 10);
    expect(entry.remaining).toBe(0);
  });

  it('should track different actors independently', async () => {
    await strategy.consume('user:1', 60_000, 5);
    await strategy.consume('user:1', 60_000, 5);
    const entry1 = await strategy.consume('user:1', 60_000, 5);
    expect(entry1.remaining).toBe(2);

    const entry2 = await strategy.consume('user:2', 60_000, 5);
    expect(entry2.remaining).toBe(4);
  });

  it('should reset a specific actor', async () => {
    await strategy.consume('user:1', 60_000, 5);
    await strategy.consume('user:1', 60_000, 5);
    await strategy.reset('user:1');
    const entry = await strategy.consume('user:1', 60_000, 5);
    expect(entry.remaining).toBe(4);
  });

  it('should set resetAt in the future', async () => {
    const entry = await strategy.consume('user:1', 60_000, 10);
    expect(entry.resetAt).toBeGreaterThan(Date.now());
  });
});
