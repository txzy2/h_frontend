-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('IN_PROGRESS', 'ORG_CREATED_EXTERNALLY', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "draft_organization" (
    "id" TEXT NOT NULL,
    "draft_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "inn" VARCHAR(12) NOT NULL,
    "kpp" VARCHAR(9) NOT NULL,
    "director" VARCHAR(255) NOT NULL,

    CONSTRAINT "draft_organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_location" (
    "id" TEXT NOT NULL,
    "draft_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(11),
    "active_places" INTEGER NOT NULL,

    CONSTRAINT "draft_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_draft" (
    "id" TEXT NOT NULL,
    "ext_user_id" TEXT NOT NULL,
    "status" "DraftStatus" NOT NULL,
    "currentStep" INTEGER NOT NULL,
    "org_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_draft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "draft_organization_draft_id_key" ON "draft_organization"("draft_id");

-- CreateIndex
CREATE INDEX "registration_draft_ext_user_id_status_idx" ON "registration_draft"("ext_user_id", "status");

-- AddForeignKey
ALTER TABLE "draft_organization" ADD CONSTRAINT "draft_organization_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "registration_draft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_location" ADD CONSTRAINT "draft_location_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "registration_draft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
