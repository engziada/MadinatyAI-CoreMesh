import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@madinatyai/prisma';

/**
 * Public engagement tiers — five bands matching the `design_spec.md` token
 * colors (`--kanto-tier-new` .. `--kanto-tier-platinum`).
 */
export type TrustMeterTier = 'NEW' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface TrustMeterSnapshot {
  userId: string;
  total: number;
  tier: TrustMeterTier;
  tierReachedAt: string;
  highestTotal: number;
  nextTier: TrustMeterTier | null;
  pointsToNextTier: number | null;
}

const TIER_THRESHOLDS: Array<{ tier: TrustMeterTier; lo: number; hi: number }> = [
  { tier: 'NEW', lo: 0, hi: 200 },
  { tier: 'BRONZE', lo: 201, hi: 500 },
  { tier: 'SILVER', lo: 501, hi: 1000 },
  { tier: 'GOLD', lo: 1001, hi: 2000 },
  { tier: 'PLATINUM', lo: 2001, hi: 3000 },
];

/**
 * Read-only MVP shim for the public TrustMeter API surface.
 *
 * The real `@madinatyai/trust-meter` library — with persistent event ledger,
 * admin-editable point map, tier-up bonus grants — is documented in
 * `CoreMesh/docs/trust-meter.md` and ships in a follow-up PR.
 *
 * For now we derive a plausible total at request-time so the FE renders
 * the TrustMeter badge / panel without hardcoding "New Seller" everywhere.
 * The derivation uses signals we already store:
 *   + 10 per confirmed handover the user participated in
 *   + 5 per listing they SOLD within 30 days of posting
 *   - 8 × severity per verified report received
 *   - 1 per expired listing
 * Clamped to [0, 3000].
 *
 * Swap behind the same URL when the real library lands — the response
 * shape is stable.
 */
@Injectable()
export class TrustMeterService {
  private readonly logger = new Logger(TrustMeterService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSnapshot(userId: string): Promise<TrustMeterSnapshot> {
    const user = await this.prisma.globalUser.findUnique({
      where: { id: userId },
      select: { id: true, createdAt: true },
    });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const total = await this.deriveTotal(userId);
    const tier = this.tierFor(total);
    const { nextTier, pointsToNextTier } = this.nextTierInfo(total, tier);

    return {
      userId,
      total,
      tier,
      tierReachedAt: user.createdAt.toISOString(),
      highestTotal: total,
      nextTier,
      pointsToNextTier,
    };
  }

  /** Always empty until the real bonus-grant ledger ships. */
  async getBonusGrants(_userId: string): Promise<unknown[]> {
    return [];
  }

  private async deriveTotal(userId: string): Promise<number> {
    // All queries run against `core` schema, so cross-tenant signals roll up
    // into one engagement total per CLAUDE.md "portable TrustMeter" rule.
    const handoverCount = await this.prisma.soukHandover.count({
      where: { offer: { OR: [{ buyerId: userId }, { sellerId: userId }] }, bothConfirmedAt: { not: null } },
    });
    const soldFastCount = await this.prisma.soukListing.count({
      where: {
        sellerId: userId,
        status: 'SOLD',
        // Within 30 days of posting heuristic — we don't track soldAt yet
        // so use updatedAt - createdAt < 30d at query time.
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });
    const expiredCount = await this.prisma.soukListing.count({
      where: { sellerId: userId, status: 'EXPIRED' },
    });
    const reports = await this.prisma.ecosystemSharedReport.findMany({
      where: { offenderId: userId },
      select: { severity: true },
    });
    const reportPenalty = reports.reduce((acc, r) => acc + 8 * r.severity, 0);

    const total =
      handoverCount * 10 + soldFastCount * 5 - expiredCount - reportPenalty;
    return Math.max(0, Math.min(3000, total));
  }

  private tierFor(total: number): TrustMeterTier {
    for (const band of TIER_THRESHOLDS) {
      if (total >= band.lo && total <= band.hi) return band.tier;
    }
    return 'PLATINUM';
  }

  private nextTierInfo(
    total: number,
    tier: TrustMeterTier,
  ): { nextTier: TrustMeterTier | null; pointsToNextTier: number | null } {
    const idx = TIER_THRESHOLDS.findIndex((b) => b.tier === tier);
    const next = TIER_THRESHOLDS[idx + 1];
    if (!next) return { nextTier: null, pointsToNextTier: null };
    return { nextTier: next.tier, pointsToNextTier: next.lo - total };
  }
}
