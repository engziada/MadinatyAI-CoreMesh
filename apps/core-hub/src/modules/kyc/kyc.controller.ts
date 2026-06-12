import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { Roles } from '@madinatyai/common';
import { KycService, ReviewKycDto, SubmitKycDto } from '@madinatyai/kyc';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

/**
 * KYC submission + admin review (core schema).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * R-11 F-04 — Auth hardening
 * ─────────────────────────────────────────────────────────────────────────
 * Before this commit, `POST /kyc` accepted `userId` from the body — any
 * logged-in user could submit forged documents for any victim, AND `PATCH
 * /:id/review` had no role check so anyone could approve their own KYC.
 *
 * Now:
 *   - submit binds the user from JWT (@CurrentUser); body no longer accepts
 *     userId. The mirroring of users.controller.submitMyKyc behaviour.
 *   - review requires @Roles('PLATFORM_ADMIN').
 *
 * NOTE: `submitMyKyc` already exists at users.controller.ts and is the FE's
 * actual call target. This /kyc controller is the admin / internal path.
 * Keeping both for now; F-15 (R-15 followup) may consolidate.
 */
@ApiTags('KYC')
@ApiBearerAuth()
@Controller('kyc')
export class KycController {
  constructor(private readonly kyc: KycService) {}

  /** Submit an ID document (base64). It is AES-256 encrypted before storage. */
  @Post()
  @AuditAction({ action: 'kyc.submit', target: 'kyc' })
  submit(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubmitKycDto) {
    const document = Buffer.from(dto.documentBase64, 'base64');
    return this.kyc.submit(user.id, dto.idNumber, document);
  }

  /** PLATFORM_ADMIN: approve/reject a KYC record. */
  @Patch(':id/review')
  @Roles('PLATFORM_ADMIN')
  @AuditAction({ action: 'kyc.review', target: 'kyc' })
  review(@Param('id') id: string, @Body() dto: ReviewKycDto) {
    return this.kyc.review(id, dto.decision);
  }
}
