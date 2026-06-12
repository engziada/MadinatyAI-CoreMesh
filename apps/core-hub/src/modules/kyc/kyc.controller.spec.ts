/**
 * KycController unit tests.
 *
 * Updated for R-11 F-04: submit binds userId from @CurrentUser. DTO no
 * longer accepts userId. The test passes a synthetic AuthenticatedUser as
 * the first argument to mirror the guard chain.
 */

import { KycController } from './kyc.controller';
import { KycService } from '@madinatyai/kyc';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

describe('KycController', () => {
  const user: AuthenticatedUser = {
    id: 'user-1',
    phoneNumber: '+201000000001',
    role: 'USER',
  } as AuthenticatedUser;

  const kycService = {
    submit: jest.fn().mockResolvedValue({ id: 'kyc-1', status: 'PENDING' }),
    review: jest.fn().mockResolvedValue({ id: 'kyc-1', status: 'APPROVED' }),
  };

  const controller = new KycController(kycService as unknown as KycService);

  beforeEach(() => jest.clearAllMocks());

  it('submits a KYC document with userId from JWT, NOT body', async () => {
    const dto = { idNumber: '1234567890', documentBase64: 'ZmFrZS1iYXNlNjQ=' };
    const result = await controller.submit(user, dto);
    expect(kycService.submit).toHaveBeenCalledWith('user-1', '1234567890', expect.any(Buffer));
    expect(result).toEqual({ id: 'kyc-1', status: 'PENDING' });
  });

  it('approves a KYC record', async () => {
    const result = await controller.review('kyc-1', { decision: 'APPROVE' });
    expect(kycService.review).toHaveBeenCalledWith('kyc-1', 'APPROVE');
    expect(result.status).toBe('APPROVED');
  });

  it('rejects a KYC record', async () => {
    const result = await controller.review('kyc-1', { decision: 'REJECT' });
    expect(kycService.review).toHaveBeenCalledWith('kyc-1', 'REJECT');
    expect(result.status).toBe('APPROVED');
  });
});
