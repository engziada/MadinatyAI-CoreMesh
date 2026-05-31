import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@madinatyai/prisma';
import { InsufficientTokensException } from './exceptions/insufficient-tokens.exception';
import { InvalidActivityException } from './exceptions/invalid-activity.exception';

/** Wallet view returned by {@link getWallet}. */
export interface WalletView {
  userId: string;
  businessTokens: number;
  individualTokens: number;
  allocations: Array<{
    activityType: string;
    tokenType: string;
    allocatedAmount: number;
  }>;
  recentTransactions: Array<{
    activityType: string;
    tokenType: string;
    amount: number;
    description: string | null;
    referenceId: string | null;
    createdAt: Date;
  }>;
}

/**
 * Closed-loop token wallet service. Users pay cash offline; platform admins
 * credit tokens. Tokens are spent across ecosystem activities at prices
 * configured in the {@link ActivityPricing} table.
 */
@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Credit tokens to a user's wallet (admin operation). */
  async credit(
    userId: string,
    amount: number,
    tokenType: 'business' | 'individual',
    reason?: string,
  ): Promise<WalletView> {
    const balanceField = tokenType === 'business' ? 'businessTokens' : 'individualTokens';

    await this.prisma.tokenWallet.upsert({
      where: { userId },
      create: {
        userId,
        businessTokens: tokenType === 'business' ? amount : 0,
        individualTokens: tokenType === 'individual' ? amount : 0,
      },
      update: {
        [balanceField]: { increment: amount },
      },
    });

    const wallet = await this.prisma.tokenWallet.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });

    await this.prisma.tokenTransaction.create({
      data: {
        walletId: wallet!.id,
        activityType: 'CREDIT',
        tokenType,
        amount,
        description: reason ?? `Admin credit of ${amount} ${tokenType} tokens`,
      },
    });

    this.logger.log(`Credited ${amount} ${tokenType} tokens to user ${userId}`);
    return this.getWallet(userId);
  }

  /** Spend tokens on an ecosystem activity. */
  async spend(
    userId: string,
    activityType: string,
    tokenType: 'business' | 'individual',
    referenceId?: string,
  ): Promise<WalletView> {
    const pricing = await this.prisma.activityPricing.findUnique({
      where: { activityType },
    });

    if (!pricing || !pricing.isActive) {
      throw new InvalidActivityException(activityType);
    }

    const wallet = await this.prisma.tokenWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new InsufficientTokensException(tokenType, pricing.cost, 0);
    }

    const balance = tokenType === 'business' ? wallet.businessTokens : wallet.individualTokens;

    if (balance < pricing.cost) {
      throw new InsufficientTokensException(tokenType, pricing.cost, balance);
    }

    const balanceField = tokenType === 'business' ? 'businessTokens' : 'individualTokens';

    await this.prisma.tokenWallet.update({
      where: { userId },
      data: { [balanceField]: { decrement: pricing.cost } },
    });

    await this.prisma.tokenTransaction.create({
      data: {
        walletId: wallet.id,
        activityType,
        tokenType,
        amount: -pricing.cost,
        description: `Spent on ${activityType}`,
        referenceId,
      },
    });

    this.logger.log(`User ${userId} spent ${pricing.cost} ${tokenType} tokens on ${activityType}`);
    return this.getWallet(userId);
  }

  /** Allocate tokens to a specific activity budget. */
  async allocate(
    userId: string,
    activityType: string,
    tokenType: 'business' | 'individual',
    amount: number,
  ): Promise<WalletView> {
    const wallet = await this.prisma.tokenWallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new InsufficientTokensException(tokenType, amount, 0);
    }

    const balance = tokenType === 'business' ? wallet.businessTokens : wallet.individualTokens;
    if (balance < amount) {
      throw new InsufficientTokensException(tokenType, amount, balance);
    }

    await this.prisma.tokenAllocation.upsert({
      where: {
        walletId_activityType_tokenType: {
          walletId: wallet.id,
          activityType,
          tokenType,
        },
      },
      create: {
        walletId: wallet.id,
        activityType,
        tokenType,
        allocatedAmount: amount,
      },
      update: {
        allocatedAmount: amount,
      },
    });

    this.logger.log(`User ${userId} allocated ${amount} ${tokenType} tokens to ${activityType}`);
    return this.getWallet(userId);
  }

  /** Get wallet balance, allocations, and recent transactions. */
  async getWallet(userId: string): Promise<WalletView> {
    const wallet = await this.prisma.tokenWallet.findUnique({
      where: { userId },
      include: {
        allocations: true,
        transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!wallet) {
      return {
        userId,
        businessTokens: 0,
        individualTokens: 0,
        allocations: [],
        recentTransactions: [],
      };
    }

    return {
      userId: wallet.userId,
      businessTokens: wallet.businessTokens,
      individualTokens: wallet.individualTokens,
      allocations: wallet.allocations.map((a: { activityType: string; tokenType: string; allocatedAmount: number }) => ({
        activityType: a.activityType,
        tokenType: a.tokenType,
        allocatedAmount: a.allocatedAmount,
      })),
      recentTransactions: wallet.transactions.map((t: { activityType: string; tokenType: string; amount: number; description: string | null; referenceId: string | null; createdAt: Date }) => ({
        activityType: t.activityType,
        tokenType: t.tokenType,
        amount: t.amount,
        description: t.description,
        referenceId: t.referenceId,
        createdAt: t.createdAt,
      })),
    };
  }

  /** List all active activity pricing entries. */
  async listActivityPricing(): Promise<Array<{ activityType: string; cost: number; description: string }>> {
    const items = await this.prisma.activityPricing.findMany({
      where: { isActive: true },
      orderBy: { activityType: 'asc' },
    });

    return items.map((i: { activityType: string; cost: number; description: string }) => ({
      activityType: i.activityType,
      cost: i.cost,
      description: i.description,
    }));
  }

  /** Set or update activity pricing (admin operation). */
  async setActivityPricing(
    activityType: string,
    cost: number,
    description: string,
    isActive = true,
  ): Promise<{ activityType: string; cost: number; description: string; isActive: boolean }> {
    const record = await this.prisma.activityPricing.upsert({
      where: { activityType },
      create: { activityType, cost, description, isActive },
      update: { cost, description, isActive, updatedAt: new Date() },
    });

    this.logger.log(`Pricing set: ${activityType} = ${cost} tokens`);
    return {
      activityType: record.activityType,
      cost: record.cost,
      description: record.description,
      isActive: record.isActive,
    };
  }
}
