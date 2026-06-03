import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@madinatyai/prisma';
import { calculateTrustScore, TrustScoreResult } from './trust-score.calculator';

/**
 * Aggregates cross-platform reputation signals from `EcosystemSharedReport`
 * (filed against the user on any linked SaaS instance) plus account age, and
 * persists the resulting score back onto the shared `GlobalUser`.
 */
@Injectable()
export class TrustScoreService {
  private readonly logger = new Logger(TrustScoreService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Compute (without persisting) the trust score for a user. */
  async compute(userId: string): Promise<TrustScoreResult> {
    const user = await this.prisma.globalUser.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`GlobalUser ${userId} not found`);
    }

    const reports = await this.prisma.ecosystemSharedReport.findMany({
      where: { offenderId: userId },
      select: { severity: true, isPlatformWideBanned: true },
    });

    return calculateTrustScore({
      createdAt: user.createdAt,
      reports,
      base: this.config.get<number>('trustScore.base'),
      banThreshold: this.config.get<number>('trustScore.banThreshold'),
    });
  }

  /** Compute and persist the trust score onto GlobalUser.trustScore. */
  async recalculate(userId: string): Promise<TrustScoreResult> {
    const result = await this.compute(userId);
    await this.prisma.globalUser.update({
      where: { id: userId },
      data: { trustScore: result.score },
    });
    this.logger.log(`TrustScore for ${userId} = ${result.score} (banned=${result.isBanned})`);
    return result;
  }
}
