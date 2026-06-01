/**
 * In-memory idempotency strategy.
 * Stores records in a Map with TTL-based cleanup.
 */
import { IdempotencyStrategy, IdempotencyRecord } from './idempotency.strategy';

export class InMemoryIdempotencyStrategy implements IdempotencyStrategy {
  private readonly store = new Map<string, IdempotencyRecord>();
  private readonly ttlMs: number;

  constructor(ttlMs = 24 * 60 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  async get(key: string): Promise<IdempotencyRecord | undefined> {
    this.evictExpired();
    return this.store.get(key);
  }

  async set(key: string, record: IdempotencyRecord): Promise<void> {
    this.evictExpired();
    this.store.set(key, record);
  }

  /** Clear all records (for testing). */
  clear(): void {
    this.store.clear();
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.store) {
      if (now - record.createdAt > this.ttlMs) {
        this.store.delete(key);
      }
    }
  }
}
