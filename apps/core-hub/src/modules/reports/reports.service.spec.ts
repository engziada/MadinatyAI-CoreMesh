import { Test, TestingModule } from '@nestjs/testing';
import { IncidentType } from '@prisma/client';
import { PrismaService } from '@madinatyai/prisma';
import { EventsService } from '@madinatyai/events';
import { TrustScoreService } from '@madinatyai/trust-score';
import { ReportsService } from './reports.service';

const makePrisma = () => ({
  ecosystemSharedReport: {
    create: jest.fn().mockResolvedValue({ id: 'r-1', severity: 3 }),
  },
});
const makeEvents = () => ({ emit: jest.fn().mockResolvedValue(undefined) });
const makeTrust = () => ({
  recalculate: jest.fn().mockResolvedValue({ score: 87, isBanned: false, penalty: 13 }),
});

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: ReturnType<typeof makePrisma>;
  let events: ReturnType<typeof makeEvents>;
  let trust: ReturnType<typeof makeTrust>;

  beforeEach(async () => {
    prisma = makePrisma();
    events = makeEvents();
    trust = makeTrust();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventsService, useValue: events },
        { provide: TrustScoreService, useValue: trust },
      ],
    }).compile();
    service = module.get(ReportsService);
  });

  it('persists, emits, and recalculates trust', async () => {
    const result = await service.file({
      reporterId: 'u-1',
      offenderId: 'u-2',
      incidentType: IncidentType.FRAUD,
      severity: 4,
      originSubdomain: 'kanto',
    });
    expect(prisma.ecosystemSharedReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reporterId: 'u-1',
        offenderId: 'u-2',
        incidentType: IncidentType.FRAUD,
        severity: 4,
        originSubdomain: 'kanto',
        isPlatformWideBanned: false,
      }),
    });
    expect(events.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceSubdomain: 'kanto',
        eventType: 'user.reported',
        userId: 'u-2',
      }),
    );
    expect(trust.recalculate).toHaveBeenCalledWith('u-2');
    expect(result.trust.score).toBe(87);
  });

  it('swallows event-bus failures so reports still file', async () => {
    events.emit.mockRejectedValueOnce(new Error('queue down'));
    await expect(
      service.file({
        reporterId: 'u-1',
        offenderId: 'u-2',
        incidentType: IncidentType.SPAM,
        severity: 1,
      }),
    ).resolves.toMatchObject({ report: { id: 'r-1' } });
    expect(trust.recalculate).toHaveBeenCalled();
  });
});
