/**
 * ReportsController unit tests.
 *
 * Updated for R-11 F-05: `reporterId` is bound from @CurrentUser, not the
 * DTO. `isPlatformWideBanned` is no longer accepted from the body and is
 * always passed to the service as `false`. Self-reports are rejected.
 */

import { ForbiddenException } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { IncidentType } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

describe('ReportsController', () => {
  const reporter: AuthenticatedUser = {
    id: 'u-1',
    phoneNumber: '+201000000001',
    role: 'USER',
  } as AuthenticatedUser;

  const reports = {
    file: jest.fn().mockResolvedValue({
      report: { id: 'report-1', severity: 3 },
      trust: { score: 100, isBanned: false, penalty: 0 },
    }),
  };

  const controller = new ReportsController(reports as unknown as ReportsService);

  beforeEach(() => jest.clearAllMocks());

  it('files a report — reporterId comes from JWT', async () => {
    const result = await controller.create(reporter, {
      offenderId: 'u-2',
      incidentType: IncidentType.FRAUD,
      severity: 3,
    });
    expect(reports.file).toHaveBeenCalledWith({
      reporterId: 'u-1',
      offenderId: 'u-2',
      incidentType: IncidentType.FRAUD,
      severity: 3,
      isPlatformWideBanned: false,
      originSubdomain: undefined,
    });
    expect(result.report.id).toBe('report-1');
    expect(result.trust.score).toBe(100);
  });

  it('passes originSubdomain through', async () => {
    await controller.create(reporter, {
      offenderId: 'u-2',
      incidentType: IncidentType.SCAM,
      severity: 5,
      originSubdomain: 'kanto',
    });
    expect(reports.file).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: 'u-1',
        offenderId: 'u-2',
        isPlatformWideBanned: false,
        originSubdomain: 'kanto',
      }),
    );
  });

  it('refuses self-report', async () => {
    await expect(
      controller.create(reporter, {
        offenderId: 'u-1', // same as reporter
        incidentType: IncidentType.SPAM,
        severity: 2,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(reports.file).not.toHaveBeenCalled();
  });
});
