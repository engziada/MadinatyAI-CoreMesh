/**
 * Idempotency strategy interface.
 * v1 ships in-memory; v2 will swap in Redis.
 */
export interface IdempotencyRecord {
  status: number;
  body: unknown;
  createdAt: number;
}

export interface IdempotencyStrategy {
  /** Get an existing record for the given key, or undefined. */
  get(key: string): Promise<IdempotencyRecord | undefined>;

  /** Store a new record. Throws if key already exists with different body hash. */
  set(key: string, record: IdempotencyRecord): Promise<void>;
}
