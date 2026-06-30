-- CreateTable
CREATE TABLE "core"."push_device_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" VARCHAR(20) NOT NULL,
    "appSlug" VARCHAR(40),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_device_tokens_token_key" ON "core"."push_device_tokens"("token");

-- CreateIndex
CREATE INDEX "push_device_tokens_userId_idx" ON "core"."push_device_tokens"("userId");

-- CreateIndex
CREATE INDEX "push_device_tokens_appSlug_idx" ON "core"."push_device_tokens"("appSlug");

-- AddForeignKey
ALTER TABLE "core"."push_device_tokens"
ADD CONSTRAINT "push_device_tokens_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "core"."GlobalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
