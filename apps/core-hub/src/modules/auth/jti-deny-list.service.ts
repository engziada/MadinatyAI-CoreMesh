import { Injectable, Logger } from '@nestjs/common';

/**
 * R-11 F-16 — In-memory JWT revocation list.
 *
 * Stores JTIs that should be refused even when their token signature + exp
 * are still valid. Entries auto-expire when their associated JWT would have
 * expired anyway, so the map can't grow unboundedly.
 *
 * v1 is in-memory only. This is correct for single-machine Fly deploys, but
 * a multi-machine production deploy MUST swap to Redis so a logout on one
 * machine is visible to the others. The interface here is small on purpose
 * so a Redis adapter is a near-drop-in.
 */
@Injectable()
export class JtiDenyListService {
  private readonly logger = new Logger(JtiDenyListService.name);
  /** Map of `jti → ms-epoch when it can be garbage-collected`. */
  private readonly revoked = new Map<string, number>();
  /** Sweep frequency — cheap, doesn't run if the map is empty. */
  private readonly sweepIntervalMs = 60_000;
  private sweepTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startSweeper();
  }

  /**
   * Add a JTI to the deny-list. `expSecondsFromEpoch` is the JWT's `exp`
   * claim — once that timestamp passes there's no point keeping the entry
   * because the token would be rejected by signature/expiry checks anyway.
   */
  revoke(jti: string, expSecondsFromEpoch: number): void {
    if (!jti) return;
    const expiresAt = expSecondsFromEpoch * 1000;
    // If the token has already expired, no need to track it.
    if (expiresAt <= Date.now()) return;
    this.revoked.set(jti, expiresAt);
  }

  /** Returns true if `jti` has been revoked AND the JWT hasn't expired yet. */
  isRevoked(jti: string): boolean {
    if (!jti) return false;
    const expiresAt = this.revoked.get(jti);
    if (expiresAt === undefined) return false;
    if (expiresAt <= Date.now()) {
      // Already expired — clean it up now and treat as not revoked
      // (signature check will reject the expired JWT anyway).
      this.revoked.delete(jti);
      return false;
    }
    return true;
  }

  /** Reset the internal map. Test-only helper. */
  reset(): void {
    this.revoked.clear();
  }

  /** Currently-tracked revocations (test/observability helper). */
  size(): number {
    return this.revoked.size;
  }

  private startSweeper(): void {
    // Keep the test runner from hanging: unref so the timer never blocks exit.
    this.sweepTimer = setInterval(() => this.sweepExpired(), this.sweepIntervalMs);
    this.sweepTimer.unref?.();
  }

  private sweepExpired(): void {
    if (this.revoked.size === 0) return;
    const now = Date.now();
    let dropped = 0;
    for (const [jti, expiresAt] of this.revoked) {
      if (expiresAt <= now) {
        this.revoked.delete(jti);
        dropped++;
      }
    }
    if (dropped > 0) {
      this.logger.debug(`JTI deny-list sweep: dropped ${dropped} expired entries`);
    }
  }
}
