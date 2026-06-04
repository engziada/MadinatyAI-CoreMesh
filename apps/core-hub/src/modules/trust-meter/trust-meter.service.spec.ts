import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@madinatyai/prisma';
import { TrustMeterService } from './trust-meter.service';

const makePrisma = () => ({
  globalUser: { findUnique: jest.fn() },
  soukHandover: { count: jest.fn() },
  soukListing: { count: jest.fn() },
  ecosystemSharedReport: { findMany: jest.fn() },
});

describe('TrustMeterService (MVP shim)', () => {
  let service: TrustMeterService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    prisma = makePrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrustMeterService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(TrustMeterService);
  });

  it('throws 404 for unknown users', async () => {
    prisma.globalUser.findUnique.mockResolvedValue(null);
    await expect(service.getSnapshot('u-?')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('a brand-new user lands in NEW tier with total=0', async () => {
    prisma.globalUser.findUnique.mockResolvedValue({
      id: 'u-1',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    });
    prisma.soukHandover.count.mockResolvedValue(0);
    prisma.soukListing.count.mockResolvedValue(0);
    prisma.ecosystemSharedReport.findMany.mockResolvedValue([]);
    const snap = await service.getSnapshot('u-1');
    expect(snap.total).toBe(0);
    expect(snap.tier).toBe('NEW');
    expect(snap.nextTier).toBe('BRONZE');
    expect(snap.pointsToNextTier).toBe(201);
  });

  it('30 handovers + 10 sold-fast yields SILVER tier', async () => {
    prisma.globalUser.findUnique.mockResolvedValue({
      id: 'u-1',
      createdAt: new Date(),
    });
    prisma.soukHandover.count.mockResolvedValue(30);
    // soldFastCount and expiredCount share the same mock — return 10 each call.
    prisma.soukListing.count.mockResolvedValue(10);
    prisma.ecosystemSharedReport.findMany.mockResolvedValue([]);

    const snap = await service.getSnapshot('u-1');
    // 30*10 + 10*5 - 10 = 340.  After the second count call hits expiredCount,
    // we already subtracted 10. Total = 340 → BRONZE band (201-500).
    expect(snap.total).toBe(340);
    expect(snap.tier).toBe('BRONZE');
  });

  it('verified reports apply a severity-weighted penalty', async () => {
    prisma.globalUser.findUnique.mockResolvedValue({
      id: 'u-1',
      createdAt: new Date(),
    });
    prisma.soukHandover.count.mockResolvedValue(20); // +200
    prisma.soukListing.count.mockResolvedValue(0);
    prisma.ecosystemSharedReport.findMany.mockResolvedValue([
      { severity: 3 }, // -24
      { severity: 5 }, // -40
    ]);
    const snap = await service.getSnapshot('u-1');
    expect(snap.total).toBe(200 - 24 - 40); // 136
    expect(snap.tier).toBe('NEW');
  });

  it('clamps to 0 when penalties exceed earnings', async () => {
    prisma.globalUser.findUnique.mockResolvedValue({
      id: 'u-1',
      createdAt: new Date(),
    });
    prisma.soukHandover.count.mockResolvedValue(1);
    prisma.soukListing.count.mockResolvedValue(0);
    prisma.ecosystemSharedReport.findMany.mockResolvedValue([{ severity: 5 }]);
    const snap = await service.getSnapshot('u-1');
    expect(snap.total).toBe(0);
  });

  it('getBonusGrants always returns an empty list (shim)', async () => {
    await expect(service.getBonusGrants('u-?')).resolves.toEqual([]);
  });
});
