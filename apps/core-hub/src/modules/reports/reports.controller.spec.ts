import { PrismaService } from '@madinatyai/prisma';
import { EventsService } from '@madinatyai/events';
import { TrustScoreService } from '@madinatyai/trust-score';
import { ReportsController } from './reports.controller';
import { IncidentType } from '@prisma/client';

describe('ReportsController', () => {
  const prisma = {
    ecosystemSharedReport: {
      create: jest.fn().mockResolvedValue({ id: 'report-1', severity: 3 }),
    },
  };
  const events = { emit: jest.fn().mockResolvedValue(undefined) };
  const trust = {
    recalculate: jest.fn().mockResolvedValue({ score: 100, isBanned: false, penalty: 0 }),
  };

  const controller = new ReportsController(
    prisma as unknown as PrismaService,
    events as unknown as EventsService,
    trust as unknown as TrustScoreService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('creates a report, emits event, and recalculates trust score', async () => {
    const result = await controller.create({
      reporterId: 'u-1',
      offenderId: 'u-2',
      incidentType: IncidentType.FRAUD,
      severity: 3,
    });
    expect(prisma.ecosystemSharedReport.create).toHaveBeenCalled();
    expect(events.emit).toHaveBeenCalled();
    expect(trust.recalculate).toHaveBeenCalledWith('u-2');
    expect(result.report.id).toBe('report-1');
    expect(result.trust.score).toBe(100);
  });

  it('sets isPlatformWideBanned default to false when omitted', async () => {
    await controller.create({
      reporterId: 'u-1',
      offenderId: 'u-2',
      incidentType: IncidentType.SCAM,
      severity: 5,
    });
    const createCall = prisma.ecosystemSharedReport.create.mock.calls[0][0].data;
    expect(createCall.isPlatformWideBanned).toBe(false);
  });
});
