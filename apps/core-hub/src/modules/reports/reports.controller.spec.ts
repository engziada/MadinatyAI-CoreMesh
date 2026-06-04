import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { IncidentType } from '@prisma/client';

describe('ReportsController', () => {
  const reports = {
    file: jest.fn().mockResolvedValue({
      report: { id: 'report-1', severity: 3 },
      trust: { score: 100, isBanned: false, penalty: 0 },
    }),
  };

  const controller = new ReportsController(reports as unknown as ReportsService);

  beforeEach(() => jest.clearAllMocks());

  it('delegates to ReportsService.file', async () => {
    const result = await controller.create({
      reporterId: 'u-1',
      offenderId: 'u-2',
      incidentType: IncidentType.FRAUD,
      severity: 3,
    });
    expect(reports.file).toHaveBeenCalledWith({
      reporterId: 'u-1',
      offenderId: 'u-2',
      incidentType: IncidentType.FRAUD,
      severity: 3,
      isPlatformWideBanned: undefined,
      originSubdomain: undefined,
    });
    expect(result.report.id).toBe('report-1');
    expect(result.trust.score).toBe(100);
  });

  it('forwards optional fields when provided', async () => {
    await controller.create({
      reporterId: 'u-1',
      offenderId: 'u-2',
      incidentType: IncidentType.SCAM,
      severity: 5,
      isPlatformWideBanned: true,
      originSubdomain: 'kanto',
    });
    expect(reports.file).toHaveBeenCalledWith(
      expect.objectContaining({
        isPlatformWideBanned: true,
        originSubdomain: 'kanto',
      }),
    );
  });
});
