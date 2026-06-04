-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tenant_soukelkanto";

-- CreateEnum
CREATE TYPE "tenant_soukelkanto"."SoukCategory" AS ENUM ('FURNITURE', 'ELECTRONICS', 'APPLIANCES', 'FASHION', 'KIDS_TOYS', 'KIDS_CLOTHING', 'KIDS_GEAR', 'BOOKS_MEDIA', 'SPORTS_OUTDOOR', 'HOME_DECOR', 'KITCHEN_DINING', 'BABY_MATERNITY', 'MOBILE_TABLETS', 'VINTAGE_COLLECTIBLES', 'MOVING_BUNDLE', 'OTHER');

-- CreateEnum
CREATE TYPE "tenant_soukelkanto"."SoukCondition" AS ENUM ('NEW_WITH_TAGS', 'LIKE_NEW', 'GOOD', 'FAIR', 'NEEDS_REPAIR', 'FOR_PARTS');

-- CreateEnum
CREATE TYPE "tenant_soukelkanto"."SoukListingStatus" AS ENUM ('ACTIVE', 'RESERVED', 'SOLD', 'PENDING_REVIEW', 'REMOVED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "tenant_soukelkanto"."SoukOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'COUNTERED', 'WITHDRAWN', 'EXPIRED', 'HANDOVER_PENDING', 'CONFIRMED', 'CLOSED');

-- CreateTable
CREATE TABLE "core"."OtpChallenge" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'LOGIN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_soukelkanto"."listings" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "category" "tenant_soukelkanto"."SoukCategory" NOT NULL,
    "condition" "tenant_soukelkanto"."SoukCondition" NOT NULL,
    "askingPrice" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EGP',
    "district" VARCHAR(64) NOT NULL,
    "status" "tenant_soukelkanto"."SoukListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "isPhotoStale" BOOLEAN NOT NULL DEFAULT false,
    "embedding" vector(768),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "boostedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_soukelkanto"."listing_photos" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "r2Key" VARCHAR(256) NOT NULL,
    "url" VARCHAR(512) NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "bytes" INTEGER NOT NULL,
    "phash" VARCHAR(64),
    "exifTakenAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "listing_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_soukelkanto"."offers" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "status" "tenant_soukelkanto"."SoukOfferStatus" NOT NULL DEFAULT 'PENDING',
    "parentOfferId" TEXT,
    "tokenHoldAmount" INTEGER,
    "tokenHoldExpiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "safeMeetSpotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_soukelkanto"."handovers" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "buyerConfirmedAt" TIMESTAMP(3),
    "sellerConfirmedAt" TIMESTAMP(3),
    "bothConfirmedAt" TIMESTAMP(3),
    "ratingWindowEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "handovers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_soukelkanto"."ratings" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "mappedSeverity" INTEGER NOT NULL,
    "reportRowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_soukelkanto"."favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_soukelkanto"."safe_meet_spots" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "nameAr" VARCHAR(120) NOT NULL,
    "district" VARCHAR(64) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safe_meet_spots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OtpChallenge_phoneNumber_createdAt_idx" ON "core"."OtpChallenge"("phoneNumber", "createdAt");

-- CreateIndex
CREATE INDEX "OtpChallenge_expiresAt_idx" ON "core"."OtpChallenge"("expiresAt");

-- CreateIndex
CREATE INDEX "listings_sellerId_idx" ON "tenant_soukelkanto"."listings"("sellerId");

-- CreateIndex
CREATE INDEX "listings_category_idx" ON "tenant_soukelkanto"."listings"("category");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "tenant_soukelkanto"."listings"("status");

-- CreateIndex
CREATE INDEX "listings_district_idx" ON "tenant_soukelkanto"."listings"("district");

-- CreateIndex
CREATE INDEX "listings_createdAt_idx" ON "tenant_soukelkanto"."listings"("createdAt");

-- CreateIndex
CREATE INDEX "listing_photos_phash_idx" ON "tenant_soukelkanto"."listing_photos"("phash");

-- CreateIndex
CREATE UNIQUE INDEX "listing_photos_listingId_position_key" ON "tenant_soukelkanto"."listing_photos"("listingId", "position");

-- CreateIndex
CREATE INDEX "offers_listingId_idx" ON "tenant_soukelkanto"."offers"("listingId");

-- CreateIndex
CREATE INDEX "offers_buyerId_idx" ON "tenant_soukelkanto"."offers"("buyerId");

-- CreateIndex
CREATE INDEX "offers_sellerId_idx" ON "tenant_soukelkanto"."offers"("sellerId");

-- CreateIndex
CREATE INDEX "offers_status_idx" ON "tenant_soukelkanto"."offers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "handovers_offerId_key" ON "tenant_soukelkanto"."handovers"("offerId");

-- CreateIndex
CREATE INDEX "ratings_targetId_idx" ON "tenant_soukelkanto"."ratings"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_offerId_raterId_key" ON "tenant_soukelkanto"."ratings"("offerId", "raterId");

-- CreateIndex
CREATE INDEX "favorites_userId_idx" ON "tenant_soukelkanto"."favorites"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_listingId_key" ON "tenant_soukelkanto"."favorites"("userId", "listingId");

-- CreateIndex
CREATE INDEX "safe_meet_spots_district_idx" ON "tenant_soukelkanto"."safe_meet_spots"("district");

-- AddForeignKey
ALTER TABLE "tenant_soukelkanto"."listing_photos" ADD CONSTRAINT "listing_photos_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "tenant_soukelkanto"."listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_soukelkanto"."offers" ADD CONSTRAINT "offers_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "tenant_soukelkanto"."listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_soukelkanto"."offers" ADD CONSTRAINT "offers_safeMeetSpotId_fkey" FOREIGN KEY ("safeMeetSpotId") REFERENCES "tenant_soukelkanto"."safe_meet_spots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_soukelkanto"."handovers" ADD CONSTRAINT "handovers_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "tenant_soukelkanto"."offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_soukelkanto"."ratings" ADD CONSTRAINT "ratings_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "tenant_soukelkanto"."offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_soukelkanto"."favorites" ADD CONSTRAINT "favorites_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "tenant_soukelkanto"."listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
