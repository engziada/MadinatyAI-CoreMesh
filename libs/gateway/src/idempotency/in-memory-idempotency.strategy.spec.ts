import { InMemoryIdempotencyStrategy } from './in-memory-idempotency.strategy';

describe('InMemoryIdempotencyStrategy', () => {
  let strategy: InMemoryIdempotencyStrategy;

  beforeEach(() => {
    strategy = new InMemoryIdempotencyStrategy();
  });

  it('should return undefined for unknown keys', async () => {
    const record = await strategy.get('unknown');
    expect(record).toBeUndefined();
  });

  it('should store and retrieve a record', async () => {
    const record = { status: 200, body: { id: '1' }, createdAt: Date.now() };
    await strategy.set('key-1', record);
    const retrieved = await strategy.get('key-1');
    expect(retrieved).toEqual(record);
  });

  it('should overwrite an existing key', async () => {
    await strategy.set('key-1', { status: 200, body: 'first', createdAt: Date.now() });
    await strategy.set('key-1', { status: 201, body: 'second', createdAt: Date.now() });
    const retrieved = await strategy.get('key-1');
    expect(retrieved!.body).toBe('second');
  });

  it('should evict expired records', async () => {
    const shortTtl = new InMemoryIdempotencyStrategy(100); // 100ms TTL
    await shortTtl.set('key-1', { status: 200, body: 'data', createdAt: Date.now() });

    // Immediately available
    expect(await shortTtl.get('key-1')).toBeDefined();

    // Wait for expiry
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(await shortTtl.get('key-1')).toBeUndefined();
  });

  it('should clear all records', async () => {
    await strategy.set('key-1', { status: 200, body: 'a', createdAt: Date.now() });
    await strategy.set('key-2', { status: 200, body: 'b', createdAt: Date.now() });
    strategy.clear();
    expect(await strategy.get('key-1')).toBeUndefined();
    expect(await strategy.get('key-2')).toBeUndefined();
  });
});
