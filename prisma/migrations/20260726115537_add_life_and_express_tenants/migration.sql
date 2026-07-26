-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tenant_express";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tenant_life";

-- CreateEnum
CREATE TYPE "tenant_life"."LifeLocationType" AS ENUM ('CITY', 'DISTRICT', 'BLOCK', 'GROUP', 'PARK', 'BUILDING', 'MALL', 'STORE', 'SERVICE_AREA', 'STREET', 'PARKING', 'OTHER');

-- CreateEnum
CREATE TYPE "tenant_life"."LifeItemType" AS ENUM ('MENU_ITEM', 'PRODUCT', 'EXHIBIT', 'MEDICAL_SERVICE');

-- CreateEnum
CREATE TYPE "tenant_life"."LifeBookingType" AS ENUM ('TABLE_RESERVATION', 'CLINIC_APPOINTMENT', 'PRODUCT_ORDER');

-- CreateEnum
CREATE TYPE "tenant_life"."LifeBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- AlterTable
ALTER TABLE "tenant_kitchen"."KitchenBusiness" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "tenant_kitchen"."KitchenMenuItem" ADD COLUMN     "scheduleType" TEXT NOT NULL DEFAULT 'ALL_DAY';

-- CreateTable
CREATE TABLE "tenant_life"."locations" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "nameAr" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "description_ar" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "parent_id" TEXT,
    "type" "tenant_life"."LifeLocationType" NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_life"."location_items" (
    "id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "title_ar" VARCHAR(120),
    "description" TEXT,
    "description_ar" TEXT,
    "price" DOUBLE PRECISION,
    "image_url" TEXT,
    "category" VARCHAR(60),
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "type" "tenant_life"."LifeItemType" NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_life"."location_bookings" (
    "id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "customer_name" VARCHAR(100) NOT NULL,
    "customer_phone" VARCHAR(20) NOT NULL,
    "date_time" TIMESTAMP(3),
    "status" "tenant_life"."LifeBookingStatus" NOT NULL DEFAULT 'PENDING',
    "type" "tenant_life"."LifeBookingType" NOT NULL,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_life"."location_posts" (
    "id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_life"."location_photos" (
    "id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" VARCHAR(200),
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_express"."couriers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "vehicleType" VARCHAR(40) NOT NULL,
    "nationalId" VARCHAR(30) NOT NULL,
    "nationalIdPhoto" TEXT,
    "personalPhoto" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "couriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_express"."delivery_requests" (
    "id" TEXT NOT NULL,
    "kitchenBusinessId" VARCHAR(60) NOT NULL,
    "kitchenName" VARCHAR(120) NOT NULL,
    "deliveryPoint" TEXT NOT NULL,
    "recipientName" VARCHAR(120) NOT NULL,
    "recipientPhone" VARCHAR(30) NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "courierId" VARCHAR(60),
    "courierName" VARCHAR(120),
    "courierPhone" VARCHAR(30),
    "acceptedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "locations_parent_id_idx" ON "tenant_life"."locations"("parent_id");

-- CreateIndex
CREATE INDEX "locations_type_idx" ON "tenant_life"."locations"("type");

-- CreateIndex
CREATE INDEX "location_items_location_id_idx" ON "tenant_life"."location_items"("location_id");

-- CreateIndex
CREATE INDEX "location_items_type_idx" ON "tenant_life"."location_items"("type");

-- CreateIndex
CREATE INDEX "location_bookings_location_id_idx" ON "tenant_life"."location_bookings"("location_id");

-- CreateIndex
CREATE INDEX "location_bookings_status_idx" ON "tenant_life"."location_bookings"("status");

-- CreateIndex
CREATE INDEX "location_bookings_type_idx" ON "tenant_life"."location_bookings"("type");

-- CreateIndex
CREATE INDEX "location_posts_location_id_idx" ON "tenant_life"."location_posts"("location_id");

-- CreateIndex
CREATE INDEX "location_posts_is_active_idx" ON "tenant_life"."location_posts"("is_active");

-- CreateIndex
CREATE INDEX "location_photos_location_id_idx" ON "tenant_life"."location_photos"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "couriers_userId_key" ON "tenant_express"."couriers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "couriers_nationalId_key" ON "tenant_express"."couriers"("nationalId");

-- AddForeignKey
ALTER TABLE "tenant_life"."locations" ADD CONSTRAINT "locations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "tenant_life"."locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_life"."location_items" ADD CONSTRAINT "location_items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "tenant_life"."locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_life"."location_bookings" ADD CONSTRAINT "location_bookings_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "tenant_life"."locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_life"."location_posts" ADD CONSTRAINT "location_posts_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "tenant_life"."locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_life"."location_photos" ADD CONSTRAINT "location_photos_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "tenant_life"."locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
