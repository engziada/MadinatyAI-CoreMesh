import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { KycService, ReviewKycDto, SubmitKycDto } from '@madinatyai/kyc';

/** KYC submission + admin review (core schema). */
@ApiTags('KYC')
@Controller('kyc')
export class KycController {
  constructor(private readonly kyc: KycService) {}

  /** Submit an ID document (base64). It is AES-256 encrypted before storage. */
  @Post()
  @AuditAction({ action: 'kyc.submit', target: 'kyc' })
  submit(@Body() dto: SubmitKycDto) {
    const document = Buffer.from(dto.documentBase64, 'base64');
    return this.kyc.submit(dto.userId, dto.idNumber, document);
  }

  /** Approve/reject a KYC record. */
  @Patch(':id/review')
  @AuditAction({ action: 'kyc.review', target: 'kyc' })
  review(@Param('id') id: string, @Body() dto: ReviewKycDto) {
    return this.kyc.review(id, dto.decision);
  }
}
