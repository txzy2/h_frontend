-- AlterTable
ALTER TABLE "registration_draft" ALTER COLUMN "expires_at" SET DEFAULT NOW() + INTERVAL '7 days';

-- CreateTable
CREATE TABLE "organization_appearance" (
    "id" TEXT NOT NULL,
    "org_id" INTEGER NOT NULL,
    "theme" VARCHAR(10) NOT NULL DEFAULT 'system',
    "brand_color" VARCHAR(7) NOT NULL DEFAULT '#f59e0b',
    "header_color" VARCHAR(7),
    "logo" BYTEA,
    "logo_mime" VARCHAR(50),
    "updated_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_appearance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_appearance_org_id_key" ON "organization_appearance"("org_id");
