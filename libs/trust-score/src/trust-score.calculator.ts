/**
 * Pure, side-effect-free TrustScore math so it can be unit-tested without a
 * database. The service layer feeds it data pulled from the core schema.
 */

/** A single cross-platform incident flag against a user. */
export interface ReportFlag {
  /** 1 (minor) .. 5 (critical). */
  severity: number;
  isPlatformWideBanned: boolean;
}

export interface TrustScoreInput {
  /** Account creation timestamp (drives the longevity bonus). */
  createdAt: Date;
  /** All shared reports filed against the user across the ecosystem. */
  reports: ReportFlag[];
  /** Reference "now" (injectable for deterministic tests). */
  now?: Date;
  base?: number;
  banThreshold?: number;
}

export interface TrustScoreResult {
  score: number;
  isBanned: boolean;
  penalty: number;
  ageBonus: number;
}

const DEFAULT_BASE = 100;
const DEFAULT_BAN_THRESHOLD = 20;
const PENALTY_PER_SEVERITY = 8; // severity 1..5 -> 8..40 points
const AGE_BONUS_PER_MONTH = 2;
const MAX_AGE_BONUS = 20;
const SCORE_MIN = 0;
const SCORE_MAX = 100;
const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30;

/**
 * Compute a user's cross-platform trust score.
 *
 * score = clamp(base - Σ(severity * weight) + ageBonus, 0, 100)
 * A user is banned when the score falls to/below the threshold OR any single
 * report carries a platform-wide ban flag.
 */
export function calculateTrustScore(input: TrustScoreInput): TrustScoreResult {
  const base = input.base ?? DEFAULT_BASE;
  const banThreshold = input.banThreshold ?? DEFAULT_BAN_THRESHOLD;
  const now = input.now ?? new Date();

  const penalty = input.reports.reduce(
    (sum, r) => sum + Math.max(0, Math.min(5, r.severity)) * PENALTY_PER_SEVERITY,
    0,
  );

  const months = Math.max(
    0,
    Math.floor((now.getTime() - input.createdAt.getTime()) / MS_PER_MONTH),
  );
  const ageBonus = Math.min(MAX_AGE_BONUS, months * AGE_BONUS_PER_MONTH);

  const raw = base - penalty + ageBonus;
  const score = Math.max(SCORE_MIN, Math.min(SCORE_MAX, raw));

  const hardBanned = input.reports.some((r) => r.isPlatformWideBanned);
  const isBanned = hardBanned || score <= banThreshold;

  return { score, isBanned, penalty, ageBonus };
}
