/** Name of the Redis-backed queue carrying cross-platform ecosystem events. */
export const ECOSYSTEM_EVENTS_QUEUE = 'ecosystem-events';

/** Job name for a cross-platform match/analytics event. */
export const CROSS_MATCH_JOB = 'cross-match';

/**
 * A tenant-originated event that should be reflected in the global
 * `EcosystemCrossMatches` ledger for cross-platform analytics.
 */
export interface EcosystemEvent {
  /** Subdomain where the action occurred (souq/kitchen/tutor/timebank). */
  sourceSubdomain: string;
  /** Domain event type, e.g. "listing.created", "kyc.approved". */
  eventType: string;
  /** Optional related GlobalUser id. */
  userId?: string;
  /** Arbitrary event metadata. */
  payload?: Record<string, unknown>;
}
