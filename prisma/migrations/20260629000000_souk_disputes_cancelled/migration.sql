-- AlterTable: add CANCELLED to SoukOfferStatus enum
ALTER TYPE "tenant_soukelkanto"."SoukOfferStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- CreateEnum: SoukDisputeReason
CREATE TYPE "tenant_soukelkanto"."SoukDisputeReason" AS ENUM ('ITEM_NOT_AS_DESCRIBED', 'ITEM_DEFECTIVE', 'NO_SHOW', 'PAYMENT_ISSUE', 'COUNTERFEIT', 'SELLER_BACKED_OUT', 'BUYER_BACKED_OUT', 'SAFETY_CONCERN', 'OTHER');

-- CreateEnum: SoukDisputeStatus
CREATE TYPE "tenant_soukelkanto"."SoukDisputeStatus" AS ENUM ('OPEN', 'RESOLVED', 'REJECTED');

-- CreateTable: SoukDispute
CREATE TABLE "tenant_soukelkanto"."disputes" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "filedById" TEXT NOT NULL,
    "againstId" TEXT NOT NULL,
    "reason" "tenant_soukelkanto"."SoukDisputeReason" NOT NULL,
    "description" TEXT,
    "evidenceR2Key" TEXT,
    "status" "tenant_soukelkanto"."SoukDisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "resolution" TEXT,
    "reportRowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "disputes_offerId_key" ON "tenant_soukelkanto"."disputes"("offerId");

-- CreateIndex
CREATE INDEX "disputes_filedById_idx" ON "tenant_soukelkanto"."disputes"("filedById");

-- CreateIndex
CREATE INDEX "disputes_againstId_idx" ON "tenant_soukelkanto"."disputes"("againstId");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "tenant_soukelkanto"."disputes"("status");

-- AddForeignKey
ALTER TABLE "tenant_soukelkanto"."disputes" ADD CONSTRAINT "disputes_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "tenant_soukelkanto"."offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
